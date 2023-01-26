import withQueryClient from 'common/src/components/QueryClientHoc';

import { NetworkMappingsPage } from './NetworkMappingsPage';

const NetworkMappingsWrapper = withQueryClient(NetworkMappingsPage);
NetworkMappingsWrapper.displayName = 'NetworkMappingsWrapper';

export default NetworkMappingsWrapper;
