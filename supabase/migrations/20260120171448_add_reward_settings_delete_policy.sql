/*
  # Add DELETE policy for reward_settings

  ## Summary
  Adds missing DELETE policy to allow parents to delete reward settings
  when deleting their children.

  ## Changes
  - Add DELETE policy for reward_settings table
  - This allows CASCADE deletes to work properly when deleting children

  ## Security
  - Policy ensures only parents can delete their own children's reward settings
*/

-- Add DELETE policy for reward_settings
CREATE POLICY "Parents can delete children's reward settings"
  ON reward_settings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = reward_settings.child_id
      AND children.parent_id = auth.uid()
    )
  );
