import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import {
  TerrainFeatureRegistry,
  instance as terrainFeatureRegistryInstance,
} from '@civ-clone/core-terrain-feature/TerrainFeatureRegistry';
import {
  Turn,
  instance as turnInstance,
} from '@civ-clone/core-turn-based-game/Turn';
import ClearingSwamp from './Rules/ClearingSwamp';
import DelayedAction from '@civ-clone/core-unit/DelayedAction';
import Moved from '@civ-clone/core-unit/Rules/Moved';
import MovementCost from '@civ-clone/core-unit/Rules/MovementCost';
import Grassland from '@civ-clone/base-terrain-grassland/Grassland';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import registerDelayedAction from '@civ-clone/core-unit/registerDelayedAction';
import Feature from '@civ-clone/core-terrain-feature/Rules/Feature';
import Shield from '@civ-clone/base-terrain-feature-shield/Shield';

export const COMPLETE = 'base-unit-action-clear-swamp:complete';

export class ClearSwamp extends DelayedAction {
  private _terrainFeatureRegistry: TerrainFeatureRegistry;

  constructor(
    from: Tile,
    to: Tile,
    unit: Unit,
    ruleRegistry: RuleRegistry = ruleRegistryInstance,
    terrainFeatureRegistry: TerrainFeatureRegistry = terrainFeatureRegistryInstance,
    turn: Turn = turnInstance
  ) {
    super(from, to, unit, ruleRegistry, turn);

    this._terrainFeatureRegistry = terrainFeatureRegistry;
  }

  perform(): void {
    const [moveCost]: number[] = this.ruleRegistry()
      .process(MovementCost, this.unit(), this)
      .sort((a: number, b: number): number => b - a);

    super.perform(moveCost, COMPLETE, ClearingSwamp);

    this.ruleRegistry().process(Moved, this.unit(), this);
  }
}

// Registered here rather than passed to `perform` as a closure: a closure
// cannot be written to a file, which is why a unit part-way through this could
// not be saved. `this.from()` becomes `unit.tile()` — the same tile, since
// `isCurrentTile` is one of this action's criteria — and the registries come
// from their singletons rather than the action instance.
registerDelayedAction({
  BusyRule: ClearingSwamp,
  handler: COMPLETE,
  action: (unit: Unit) => new ClearSwamp(unit.tile(), unit.tile(), unit),
  complete: (unit: Unit) => {
    const terrain = new Grassland(),
      features = terrainFeatureRegistryInstance.getByTerrain(
        unit.tile().terrain()
      );

    ruleRegistryInstance.process(Feature, Shield, terrain);

    terrainFeatureRegistryInstance.unregister(...features);

    unit.tile().setTerrain(terrain);
  },
});

export default ClearSwamp;
