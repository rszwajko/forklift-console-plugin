import withQueryClient from 'src/components/QueryClientHoc';

import { NetworkMappingsPage } from './NetworkMappingsPage';

const NetworkMappingsWrapper = withQueryClient(NetworkMappingsPage);
NetworkMappingsWrapper.displayName = 'NetworkMappingsWrapper';

export default NetworkMappingsWrapper;
