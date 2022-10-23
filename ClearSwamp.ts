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
import Feature from '@civ-clone/core-terrain-feature/Rules/Feature';
import Grassland from '@civ-clone/base-terrain-grassland/Grassland';
import Moved from '@civ-clone/core-unit/Rules/Moved';
import MovementCost from '@civ-clone/core-unit/Rules/MovementCost';
import Shield from '@civ-clone/base-terrain-feature-shield/Shield';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';

// TODO: This is specific to the original Civilization and might need to be labelled as `-civ1` as other games have
//  forests as a feature
export class ClearSwamp extends DelayedAction {
  #terrainFeatureRegistry: TerrainFeatureRegistry;

  constructor(
    from: Tile,
    to: Tile,
    unit: Unit,
    ruleRegistry: RuleRegistry = ruleRegistryInstance,
    terrainFeatureRegistry: TerrainFeatureRegistry = terrainFeatureRegistryInstance,
    turn: Turn = turnInstance
  ) {
    super(from, to, unit, ruleRegistry, turn);

    this.#terrainFeatureRegistry = terrainFeatureRegistry;
  }

  perform(): void {
    const [moveCost]: number[] = this.ruleRegistry()
      .process(MovementCost, this.unit(), this)
      .sort((a: number, b: number): number => b - a);

    super.perform(
      moveCost,
      (): void => {
        const terrain = new Grassland(),
          features = this.#terrainFeatureRegistry.getByTerrain(
            this.from().terrain()
          );

        this.ruleRegistry().process(Feature, Shield, terrain);

        this.#terrainFeatureRegistry.unregister(...features);

        this.from().setTerrain(terrain);
      },
      ClearingSwamp
    );

    this.ruleRegistry().process(Moved, this.unit(), this);
  }
}

export default ClearSwamp;
