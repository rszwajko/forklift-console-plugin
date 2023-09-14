import { V1VirtualMachine } from '../../k8s/V1VirtualMachine';

import { OpenshiftResource } from './Resource';

// https://github.com/kubev2v/forklift/blob/main/pkg/controller/provider/web/ocp/vm.go
export interface OpenshiftVM extends OpenshiftResource {
  object: V1VirtualMachine;
}
