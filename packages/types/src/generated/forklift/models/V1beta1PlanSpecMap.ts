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

import { V1beta1PlanSpecMapNetwork } from './V1beta1PlanSpecMapNetwork';
import { V1beta1PlanSpecMapStorage } from './V1beta1PlanSpecMapStorage';

/**
 * Resource mapping.
 *
 * @export
 */
export interface V1beta1PlanSpecMap {
  /** network
   * Network.
   *
   * @required {false}
   */
  network?: V1beta1PlanSpecMapNetwork;
  /** storage
   * Storage.
   *
   * @required {false}
   */
  storage?: V1beta1PlanSpecMapStorage;
}
