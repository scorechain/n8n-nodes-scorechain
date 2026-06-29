import {
  IDataObject,
  IExecuteFunctions,
  ILoadOptionsFunctions,
  INodeExecutionData,
  INodePropertyOptions,
  INodeType,
  INodeTypeDescription,
  NodeApiError,
} from 'n8n-workflow';

import { SCORECHAIN_API_BASE_URL } from '../../constants';

// Bundled fallback list, used when the live /blockchains list can't be fetched
// (e.g. no credential set yet, or the API is unreachable).
const FALLBACK_BLOCKCHAINS: INodePropertyOptions[] = [
  { name: 'Algorand', value: 'ALGORAND' },
  { name: 'Arbitrum One', value: 'ARBITRUMONE' },
  { name: 'Avalanche', value: 'AVALANCHE' },
  { name: 'Base', value: 'BASE' },
  { name: 'Bitcoin', value: 'BITCOIN' },
  { name: 'Bitcoin Cash', value: 'BITCOINCASH' },
  { name: 'Blast', value: 'BLAST' },
  { name: 'BSC', value: 'BSC' },
  { name: 'Cardano', value: 'CARDANO' },
  { name: 'Dash', value: 'DASH' },
  { name: 'Dogecoin', value: 'DOGECOIN' },
  { name: 'Ethereum', value: 'ETHEREUM' },
  { name: 'Ink', value: 'INK' },
  { name: 'Litecoin', value: 'LITECOIN' },
  { name: 'Mantle', value: 'MANTLE' },
  { name: 'Optimism', value: 'OPTIMISM' },
  { name: 'Polygon', value: 'POLYGON' },
  { name: 'Ripple', value: 'RIPPLE' },
  { name: 'Solana', value: 'SOLANA' },
  { name: 'Stellar', value: 'STELLAR' },
  { name: 'Tezos', value: 'TEZOS' },
  { name: 'TON', value: 'TON' },
  { name: 'TRON', value: 'TRON' },
];

export class Scorechain implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Scorechain',
    name: 'scorechain',
    icon: 'file:scorechain.svg',
    group: ['transform'],
    version: 1,
    description: 'Get an AML/risk score for a crypto address, transaction or wallet via the Scorechain API',
    // Allows this node to be used as a tool by n8n AI Agents. This only takes
    // effect when the instance operator opts in with
    // N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE=true; it is inert by default.
    usableAsTool: true,
    defaults: { name: 'Scorechain' },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [{ name: 'scorechainApi', required: true }],
    properties: [
      {
        displayName: 'Analysis Type',
        name: 'analysisType',
        type: 'options',
        options: [
          { name: 'Assigned', value: 'ASSIGNED' },
          { name: 'Incoming', value: 'INCOMING' },
          { name: 'Outgoing', value: 'OUTGOING' },
          { name: 'Full', value: 'FULL' },
        ],
        default: 'FULL',
        required: true,
      },
      {
        displayName: 'Object Type',
        name: 'objectType',
        type: 'options',
        options: [
          { name: 'Address', value: 'ADDRESS' },
          { name: 'Transaction', value: 'TRANSACTION' },
          { name: 'Wallet', value: 'WALLET' },
        ],
        default: 'ADDRESS',
        required: true,
      },
      {
        displayName: 'Object ID',
        name: 'objectId',
        type: 'string',
        default: '',
        required: true,
        placeholder: 'Transaction hash or address',
      },
      {
        displayName: 'Blockchain Name or ID',
        name: 'blockchain',
        type: 'options',
        description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
        // Populated live from GET /blockchains once a credential is set; falls
        // back to FALLBACK_BLOCKCHAINS when it can't be fetched.
        typeOptions: { loadOptionsMethod: 'getBlockchains' },
        default: 'ETHEREUM',
        required: true,
      },
      {
        displayName: 'Additional Options',
        name: 'additionalOptions',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        options: [
          {
            displayName: 'Coin',
            name: 'coin',
            type: 'string',
            default: '',
            placeholder: 'ALL, MAIN, or smart contract address (e.g. 0xdac17f958d2ee523a2206206994597c13d831ec7 for USDT)',
            description: 'ALL = all assets, MAIN = native coin only, or the smart contract address of the token',
          },
          {
            displayName: 'Depth',
            name: 'depth',
            type: 'number',
            default: 1,
            description: 'Max analysis depth. UTXO blockchains allow up to 100, account-based up to 6.',
          },
          {
            displayName: 'End Date',
            name: 'endDate',
            type: 'dateTime',
            default: '',
            description: 'Only trace transaction flows up to this date',
          },
          {
            displayName: 'Group By',
            name: 'groupBy',
            type: 'options',
            default: 'ENTITY',
            description: 'How to group the INCOMING/OUTGOING details',
            options: [
              { name: 'Entity', value: 'ENTITY' },
              { name: 'Type', value: 'TYPE' },
            ],
          },
          {
            displayName: 'Start Date',
            name: 'startDate',
            type: 'dateTime',
            default: '',
            description: 'Only trace transaction flows from this date onward',
          },
          {
            displayName: 'Timeout',
            name: 'timeout',
            type: 'number',
            default: 60,
            description: 'Max time in seconds to wait for the Scorechain API response before failing. Typical scoring responses return in under 5 seconds.',
          },
        ],
      },
    ],
  };

  methods = {
    loadOptions: {
      // Fetch the supported blockchains live so the dropdown stays in sync with
      // the API. Falls back to the bundled list if the call fails.
      async getBlockchains(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        try {
          const res = (await this.helpers.httpRequestWithAuthentication.call(
            this,
            'scorechainApi',
            { method: 'GET', url: `${SCORECHAIN_API_BASE_URL}/blockchains`, json: true },
          )) as Array<{ id: string; name: string; coverageType?: string }>;

          // This node only supports FULL-coverage blockchains; scoring analysis
          // is not available on minimal-coverage chains.
          const full = (Array.isArray(res) ? res : [])
            .filter((b) => b.coverageType === 'FULL')
            .map((b) => ({ name: b.name, value: b.id }))
            .sort((a, b) => a.name.localeCompare(b.name));

          return full.length > 0 ? full : FALLBACK_BLOCKCHAINS;
        } catch {
          return FALLBACK_BLOCKCHAINS;
        }
      },
    },
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const body: Record<string, unknown> = {
          analysisType: this.getNodeParameter('analysisType', i) as string,
          objectType: this.getNodeParameter('objectType', i) as string,
          objectId: (this.getNodeParameter('objectId', i) as string).trim(),
          blockchain: this.getNodeParameter('blockchain', i) as string,
        };

        const options = this.getNodeParameter('additionalOptions', i, {}) as {
          coin?: string;
          depth?: number;
          startDate?: string;
          endDate?: string;
          groupBy?: string;
          timeout?: number;
        };

        // dateTime fields arrive as ISO strings; the API expects a UTC Unix
        // timestamp in seconds.
        const toUnix = (value?: string): number | undefined => {
          if (!value) return undefined;
          const ms = new Date(value).getTime();
          return Number.isNaN(ms) ? undefined : Math.floor(ms / 1000);
        };

        if (options.coin) body.coin = options.coin;
        if (options.depth && options.depth > 0) body.depth = options.depth;
        const startUnix = toUnix(options.startDate);
        const endUnix = toUnix(options.endDate);
        if (startUnix !== undefined) body.startDate = startUnix;
        if (endUnix !== undefined) body.endDate = endUnix;
        if (options.groupBy) body.groupBy = options.groupBy;

        const timeoutSec = options.timeout && options.timeout > 0 ? options.timeout : 60;

        const response = await this.helpers.httpRequestWithAuthentication.call(
          this,
          'scorechainApi',
          {
            method: 'POST',
            url: `${SCORECHAIN_API_BASE_URL}/scoringAnalysis`,
            headers: { 'Content-Type': 'application/json' },
            body,
            json: true,
            timeout: timeoutSec * 1000,
          },
        );

        returnData.push({ json: response as IDataObject, pairedItem: { item: i } });

      } catch (error) {
        // n8n's request helper wraps HTTP errors into a NodeApiError before it
        // reaches us: the API's own explanation (e.g. Scorechain's "'objectId'
        // needs to be a valid address ...") lands in `description`, while
        // `message` is only a generic "Bad request ..." string. Surface the
        // useful one, falling back to message for non-HTTP errors (timeouts).
        const e = error as {
          message?: string;
          description?: string;
          httpCode?: string | number;
        };
        const reason = e.description ?? e.message;

        if (this.continueOnFail()) {
          returnData.push({
            json: { error: reason, httpCode: e.httpCode },
            pairedItem: { item: i },
          });
          continue;
        }

        // NodeApiError already carries the extracted description/httpCode, so
        // re-wrapping it shows the right message in the UI.
        throw new NodeApiError(this.getNode(), error as never);
      }
    }

    return [returnData];
  }
}
