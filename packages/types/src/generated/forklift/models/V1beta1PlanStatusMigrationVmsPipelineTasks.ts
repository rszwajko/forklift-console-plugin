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

import { V1beta1PlanStatusMigrationVmsPipelineTasksError } from './V1beta1PlanStatusMigrationVmsPipelineTasksError';
import { V1beta1PlanStatusMigrationVmsPipelineTasksProgress } from './V1beta1PlanStatusMigrationVmsPipelineTasksProgress';

/**
 * Migration task.
 *
 * @export
 */
export interface V1beta1PlanStatusMigrationVmsPipelineTasks {
  /** annotations
   * Annotations.
   *
   * @required {false}
   * @originalType {not defined}
   */
  annotations?: unknown | null;
  /** completed
   * Completed timestamp.
   *
   * @required {false}
   * @format {date-time}
   */
  completed?: string;
  /** description
   * Name
   *
   * @required {false}
   */
  description?: string;
  /** error
   * Error.
   *
   * @required {false}
   */
  error?: V1beta1PlanStatusMigrationVmsPipelineTasksError;
  /** name
   * Name.
   *
   * @required {true}
   */
  name: string;
  /** phase
   * Phase
   *
   * @required {false}
   */
  phase?: string;
  /** progress
   * Progress.
   *
   * @required {false}
   */
  progress?: V1beta1PlanStatusMigrationVmsPipelineTasksProgress;
  /** reason
   * Reason
   *
   * @required {false}
   */
  reason?: string;
  /** started
   * Started timestamp.
   *
   * @required {false}
   * @format {date-time}
   */
  started?: string;
}
