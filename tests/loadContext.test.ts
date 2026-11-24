import { COMPLETE } from '../ClearSwamp';
import { instance as busyRegistryInstance } from '@civ-clone/core-unit/BusyRegistry';
import ClearingSwamp from '../Rules/ClearingSwamp';
import Effect from '@civ-clone/core-rule/Effect';
import Feature from '@civ-clone/core-terrain-feature/Rules/Feature';
import Grassland from '@civ-clone/base-terrain-grassland/Grassland';
import PendingEffect from '@civ-clone/core-pending-effect/PendingEffect';
import PendingEffectRegistry from '@civ-clone/core-pending-effect/PendingEffectRegistry';
import Player from '@civ-clone/core-player/Player';
import RuleRegistry, {
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import Shield from '@civ-clone/base-terrain-feature-shield/Shield';
import Terrain from '@civ-clone/core-terrain/Terrain';
import TerrainFeature from '@civ-clone/core-terrain-feature/TerrainFeature';
import Tile from '@civ-clone/core-world/Tile';
import Turn from '@civ-clone/core-turn-based-game/Turn';
import Unit from '@civ-clone/core-unit/Unit';
import World from '@civ-clone/core-world/World';
import { expect } from 'chai';

class Before extends Terrain {}
class Settlers extends Unit {}

// A save loaded into a game with its own registries finishes the job there (civ-clone/web-renderer#248).
describe('ClearSwamp loaded into another game', (): void => {
  it("rolls for the Shield through the loading game's `Feature` rules, not the module instance's", (): void => {
    const context = {
        pendingEffects: new PendingEffectRegistry(),
        rules: new RuleRegistry(),
        turn: new Turn(),
      },
      loadingAsked: (typeof TerrainFeature)[] = [],
      instanceAsked: (typeof TerrainFeature)[] = [],
      loadingRule = new Feature(
        new Effect((FeatureType: typeof TerrainFeature): void => {
          loadingAsked.push(FeatureType);
        })
      ),
      instanceRule = new Feature(
        new Effect((FeatureType: typeof TerrainFeature): void => {
          instanceAsked.push(FeatureType);
        })
      ),
      tile = new Tile(0, 0, new Before(), null as unknown as World),
      unit = new Settlers(null, new Player(), tile, context.rules);

    context.rules.register(loadingRule);
    ruleRegistryInstance.register(instanceRule);

    try {
      context.turn.set(1);
      context.pendingEffects.register(
        new PendingEffect(COMPLETE, unit, { endTurn: '1' })
      );

      const busy = busyRegistryInstance.rebuild('ClearingSwamp', unit, context);

      expect(busy).to.instanceof(ClearingSwamp);

      busy.process();

      expect(tile.terrain()).to.instanceof(Grassland);
      expect(loadingAsked).to.deep.equal([Shield]);
      expect(instanceAsked).to.deep.equal([]);
    } finally {
      ruleRegistryInstance.unregister(instanceRule);
    }
  });
});
