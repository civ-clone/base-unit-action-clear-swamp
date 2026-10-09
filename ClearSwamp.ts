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
  // The terrain finishing leaves behind, a static for the same reason `complete` is: the UI is sent it to show what the
  //  action will do, so it is read from here rather than worked out again elsewhere.
  static readonly result = Grassland;

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

  /**
   * What finishing does, against the registries this action was constructed
   * with.
   *
   * This was the closure passed to `perform`, bound to `this`. Converting it
   * to a `PendingEffect` handler first moved it to module scope, where `this`
   * is gone, and the registries became `…Instance` singletons — invisible in
   * the game, which uses the singletons, and wrong everywhere else. A method
   * keeps the original body — `this` read as `action` — and
   * `registerDelayedAction` hands the handler the action that was performed,
   * so this runs on that one.
   *
   * Static, because an instance method would not compile: a new public member
   * makes this class unassignable to `Action` (`DataObject._keys:
   * (keyof this)[]`), and it is passed as one to `MovementCost` and `Moved`.
   * A static method of the class may still read its instances' private
   * fields, and does not change `keyof this`.
   */
  static complete(action: ClearSwamp): void {
    const terrain = new ClearSwamp.result(),
      features = action._terrainFeatureRegistry.getByTerrain(
        action.from().terrain()
      );

    action.ruleRegistry().process(Feature, Shield, terrain);

    action._terrainFeatureRegistry.unregister(...features);

    action.from().setTerrain(terrain);
  }
}

// Registered here rather than passed to `perform` as a closure: a closure
// cannot be written to a file, which is why a unit part-way through this could
// not be saved. The behaviour itself stays on the action, in `complete()`.
registerDelayedAction({
  BusyRule: ClearingSwamp,
  handler: COMPLETE,
  action: (unit: Unit) => new ClearSwamp(unit.tile(), unit.tile(), unit),
  complete: (unit, pendingEffect, action) => ClearSwamp.complete(action),
});

export default ClearSwamp;
