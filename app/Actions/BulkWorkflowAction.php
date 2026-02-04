<?php
namespace App\Actions;

use App\Contracts\Workflowable;
use App\Enums\WorkflowAction;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class BulkWorkflowAction
{
  public function execute(
    Workflowable|string $model,
    WorkflowAction $action,
    array $ids,
    User $user,
    array $extraData = []
  ): int {
    $modelClass = is_string($model) ? $model : get_class($model);
    $workflow = $modelClass::workflowMap()[$action->value] ?? [];
    $totalCount = 0;
    $isAdmin = $user->hasRole('admin');

    $processedIds = [];

    foreach ($workflow as $role => $rule) {
      if (!$user->hasRole($role) && !$isAdmin) {
        continue;
      }

      // Filter query to only include IDs that haven't been processed yet
      // We re-instantiate the query because we need a fresh builder
      $query = $modelClass::baseQuery($ids);

      if (!empty($processedIds)) {
        $query->whereNotIn('id', $processedIds);
      }

      if (isset($rule['from'])) {
        if (is_array($rule['from'])) {
          $query->whereIn('status', $rule['from']);
        } else {
          $query->where('status', $rule['from']);
        }
      }

      if (!empty($rule['delete'])) {
        $idsToDelete = $query->pluck('id')->toArray();
        if (empty($idsToDelete))
          continue;

        // Iterate and delete individually to trigger events
        DB::transaction(function () use ($modelClass, $idsToDelete) {
          foreach ($modelClass::whereIn('id', $idsToDelete)->cursor() as $modelInstance) {
            $modelInstance->delete();
          }
        });

        $processedIds = array_merge($processedIds, $idsToDelete);
        $totalCount += count($idsToDelete);
        continue;
      }

      $update = [
        'status' => $rule['to'] ?? 'rejected',
      ];

      if (!empty($rule['timestamp'])) {
        $update[$rule['timestamp']] = now();
      }

      // Get IDs that will be updated to exclude them from next iterations
      $idsToUpdate = $query->pluck('id')->toArray();

      if (empty($idsToUpdate)) {
        continue;
      }

      // Iterate and update individually to trigger events
      DB::transaction(function () use ($modelClass, $idsToUpdate, $update, $extraData) {
        foreach ($modelClass::whereIn('id', $idsToUpdate)->cursor() as $modelInstance) {
          $modelInstance->update(array_merge($update, $extraData));
        }
      });

      $processedIds = array_merge($processedIds, $idsToUpdate);
      $totalCount += count($idsToUpdate);
    }

    return $totalCount;
  }
}