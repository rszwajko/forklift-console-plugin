/**
 * 
 * 
 *
 * The version of the OpenAPI document: 
 * Contact Email: 
 * License: 
 *
 * NOTE: This file is auto generated by crdtotypes (https://github.com/yaacov/crdtoapi/).
 * https://github.com/yaacov/crdtoapi/README.crdtotypes
 */

import { V1beta1PlanStatusMigrationVmsHooksHook } from './V1beta1PlanStatusMigrationVmsHooksHook';

/**
 * Plan hook.
 *
 * @export
 */
export interface V1beta1PlanStatusMigrationVmsHooks {
  /** hook
   * Hook reference.
   *
   * @required {false}
   */
  hook?: V1beta1PlanStatusMigrationVmsHooksHook;
  /** step
   * Pipeline step.
   *
   * @required {true}
   */
  step: string;
}
