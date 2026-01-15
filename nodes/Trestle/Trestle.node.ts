import type {
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

export class Trestle implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Trestle',
		name: 'trestle',
		icon: 'file:trestle.svg',
		group: ['transform'],
		version: 2,
		description: 'Validate phone numbers, emails, and contacts using Trestle APIs.',
		defaults: {
			name: 'Trestle',
		},
		inputs: ['main'],
		outputs: ['main'],
		usableAsTool: true,
		credentials: [
			{
				name: 'trestleApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Phone Validation',
						value: 'phoneValidation',
						description: 'Validate phone numbers and get activity scores',
					},
					{
						name: 'Real Contact',
						value: 'realContact',
						description: 'Comprehensive contact verification and grading',
					},
				],
				default: 'phoneValidation',
			},
			// Phone Validation Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['phoneValidation'],
					},
				},
				options: [
					{
						name: 'Validate Phone Number',
						value: 'validate',
						description: 'Validates phone numbers from input data',
						action: 'Validate phone numbers',
					},
				],
				default: 'validate',
			},
			// Real Contact Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['realContact'],
					},
				},
				options: [
					{
						name: 'Verify Contact',
						value: 'verify',
						description: 'Verify and grade phone, email, and address information',
						action: 'Verify contact information',
					},
				],
				default: 'verify',
			},
			// Phone Validation Fields
			{
				displayName: 'Phone Numbers Field',
				name: 'phoneField',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['phoneValidation'],
					},
				},
				default: 'phone',
				description: 'Field name containing phone numbers in input data',
			},
			{
				displayName: 'Country Hint',
				name: 'countryHint',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['phoneValidation'],
					},
				},
				default: '',
				description: 'The ISO-3166 alpha-2 country code of the phone number (e.g., US)',
			},
			// Real Contact Fields
			{
				displayName: 'Name Field',
				name: 'nameField',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['realContact'],
					},
				},
				default: 'name',
				description: 'Field name containing contact names in input data',
			},
			{
				displayName: 'Phone Number Field',
				name: 'phoneField',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['realContact'],
					},
				},
				default: 'phone',
				description: 'Field name containing phone numbers in input data',
			},
			{
				displayName: 'Email Field',
				name: 'emailField',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['realContact'],
					},
				},
				default: 'email',
				description: 'Field name containing email addresses in input data (optional)',
			},
			{
				displayName: 'IP Address Field',
				name: 'ipAddressField',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['realContact'],
					},
				},
				default: 'ip',
				description: 'Field name containing IP addresses in input data (optional)',
			},
			{
				displayName: 'Address Field',
				name: 'addressField',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['realContact'],
					},
				},
				default: 'address',
				description: 'Field name containing street addresses in input data (optional)',
			},
			{
				displayName: 'City Field',
				name: 'cityField',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['realContact'],
					},
				},
				default: 'city',
				description: 'Field name containing city names in input data (optional)',
			},
			{
				displayName: 'State Field',
				name: 'stateField',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['realContact'],
					},
				},
				default: 'state',
				description: 'Field name containing state codes in input data (optional)',
			},
			{
				displayName: 'Postal Code Field',
				name: 'postalCodeField',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['realContact'],
					},
				},
				default: 'postal_code',
				description: 'Field name containing postal codes in input data (optional)',
			},
			{
				displayName: 'Include Email Deliverability',
				name: 'includeEmailDeliverability',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['realContact'],
					},
				},
				default: false,
				description: 'Whether to include email deliverability checks (additional cost)',
			},
			{
				displayName: 'Include Litigator Check',
				name: 'includeLitigatorCheck',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['phoneValidation', 'realContact'],
					},
				},
				default: false,
				description: 'Whether to include litigator checks (additional cost)',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const resource = this.getNodeParameter('resource', i);
			const operation = this.getNodeParameter('operation', i);

			try {
				if (resource === 'phoneValidation') {
					let phone: string;

					if (operation === 'validate' || operation === 'batchValidate') {
						const phoneField = this.getNodeParameter('phoneField', i) as string;
						phone = items[i].json[phoneField] as string;
						if (!phone) {
							throw new NodeOperationError(this.getNode(), `Phone number not found in field '${phoneField}'`, {
								itemIndex: i,
							});
						}
					} else {
						continue;
					}

					// Phone Validation API call
					const countryHint = this.getNodeParameter('countryHint', i) as string;
					const includeLitigatorCheck = this.getNodeParameter('includeLitigatorCheck', i) as boolean;

					let queryString = `phone=${encodeURIComponent(phone)}`;
					if (countryHint) {
						queryString += `&phone.country_hint=${encodeURIComponent(countryHint)}`;
					}
					if (includeLitigatorCheck) {
						queryString += `&addons=litigator_check`;
					}

					const phoneOptions: IHttpRequestOptions = {
						method: 'GET',
						url: `https://api.trestleiq.com/3.0/phone_intel?${queryString}`,
					};

					const phoneApiResponse = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'trestleApi',
						phoneOptions,
					);

					returnData.push({
						json: phoneApiResponse,
						pairedItem: { item: i },
					});

				} else if (resource === 'realContact' && operation === 'verify') {
					// Real Contact API call
					const nameField = this.getNodeParameter('nameField', i) as string;
					const phoneField = this.getNodeParameter('phoneField', i) as string;
					const emailField = this.getNodeParameter('emailField', i) as string;
					const ipAddressField = this.getNodeParameter('ipAddressField', i) as string;
					const addressField = this.getNodeParameter('addressField', i) as string;
					const cityField = this.getNodeParameter('cityField', i) as string;
					const stateField = this.getNodeParameter('stateField', i) as string;
					const postalCodeField = this.getNodeParameter('postalCodeField', i) as string;

					const name = items[i].json[nameField] as string;
					const phone = items[i].json[phoneField] as string;
					const email = items[i].json[emailField] as string;
					const ipAddress = items[i].json[ipAddressField] as string;
					const address = items[i].json[addressField] as string;
					const city = items[i].json[cityField] as string;
					const state = items[i].json[stateField] as string;
					const postalCode = items[i].json[postalCodeField] as string;

					if (!name) {
						throw new NodeOperationError(this.getNode(), `Name not found in field '${nameField}'`, {
							itemIndex: i,
						});
					}
					if (!phone) {
						throw new NodeOperationError(this.getNode(), `Phone number not found in field '${phoneField}'`, {
							itemIndex: i,
						});
					}
					const includeEmailDeliverability = this.getNodeParameter('includeEmailDeliverability', i) as boolean;
					const includeLitigatorCheck = this.getNodeParameter('includeLitigatorCheck', i) as boolean;

					const body: any = {
						name,
						phone,
					};

					if (email) body.email = email;
					if (ipAddress) body.ip = ipAddress;
					if (address) body.address = address;
					if (city) body.city = city;
					if (state) body.state = state;
					if (postalCode) body.postal_code = postalCode;

					const addons = [];
					if (includeEmailDeliverability) addons.push('email_deliverability');
					if (includeLitigatorCheck) addons.push('litigator_check');
					if (addons.length > 0) body.addons = addons.join(',');

					const contactOptions: IHttpRequestOptions = {
						method: 'POST',
						url: 'https://api.trestleiq.com/1.1/real_contact',
						headers: {
							'Content-Type': 'application/json',
						},
						body,
					};

					const contactApiResponse = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'trestleApi',
						contactOptions,
					);

					returnData.push({
						json: contactApiResponse,
						pairedItem: { item: i },
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,

						},
						error,
						pairedItem: { item: i },
					});
				} else {
					if (error.context) {
						error.context.itemIndex = i;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex: i,
					});
				}
			}
		}

		return [returnData];
	}


}
