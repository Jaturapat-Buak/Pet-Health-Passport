// SQL fragments accept only static identifiers from server code, never user input.
export function appointmentScope(petAlias, actorParam) {
  return `EXISTS (SELECT 1 FROM users actor WHERE actor.id = ${actorParam} AND (
    actor.role = 'admin' OR
    (actor.role = 'owner' AND ${petAlias}.owner_id = actor.id) OR
    (actor.role = 'vet' AND EXISTS (SELECT 1 FROM pet_vet_access access
      WHERE access.pet_id = ${petAlias}.id AND access.vet_id = actor.id))))`;
}
