import ClearSwamp from '../ClearSwamp';
import Effect from '@civ-clone/core-rule/Effect';
import Feature from '@civ-clone/core-terrain-feature/Rules/Feature';
import Shield from '@civ-clone/base-terrain-feature-shield/Shield';
import Grassland from '@civ-clone/base-terrain-grassland/Grassland';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Terrain from '@civ-clone/core-terrain/Terrain';
import TerrainChanged from '@civ-clone/core-world/Rules/TerrainChanged';
import TerrainFeature from '@civ-clone/core-terrain-feature/TerrainFeature';
import TerrainFeatureRegistry from '@civ-clone/core-terrain-feature/TerrainFeatureRegistry';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import World from '@civ-clone/core-world/World';
import { carryFeatures } from '@civ-clone/base-terrain-feature/lib/replaceFeatures';
import { expect } from 'chai';

class Before extends Terrain {}
class Ore extends TerrainFeature {}
class Fruit extends TerrainFeature {}

describe('ClearSwamp', (): void => {
  const complete = (
    ruleRegistry: RuleRegistry,
    terrainFeatureRegistry: TerrainFeatureRegistry
  ): [Tile, Terrain] => {
    const tile = new Tile(
        0,
        0,
        new Before(),
        null as unknown as World,
        ruleRegistry
      ),
      from = tile.terrain();

    terrainFeatureRegistry.register(new Ore(from), new Fruit(from));

    ClearSwamp.complete(
      new ClearSwamp(
        tile,
        tile,
        null as unknown as Unit,
        ruleRegistry,
        terrainFeatureRegistry
      )
    );

    return [tile, from];
  };

  it('should give the square a new Grassland and process `TerrainChanged` once', (): void => {
    const ruleRegistry = new RuleRegistry(),
      seen: [Tile, Terrain, Terrain][] = [];

    ruleRegistry.register(
      new TerrainChanged(
        new Effect((tile: Tile, from: Terrain, to: Terrain): void => {
          seen.push([tile, from, to]);
        })
      )
    );

    const [tile, from] = complete(ruleRegistry, new TerrainFeatureRegistry());

    expect(tile.terrain()).to.instanceof(Grassland);
    expect(seen).to.deep.equal([[tile, from, tile.terrain()]]);
  });

  it("should carry the square's features onto the new terrain with a `carryFeatures` rule", (): void => {
    const ruleRegistry = new RuleRegistry(),
      terrainFeatureRegistry = new TerrainFeatureRegistry();

    ruleRegistry.register(
      new TerrainChanged(new Effect(carryFeatures(terrainFeatureRegistry)))
    );

    const [tile, from] = complete(ruleRegistry, terrainFeatureRegistry);

    expect(
      terrainFeatureRegistry
        .getByTerrain(tile.terrain())
        .map((feature: TerrainFeature) => feature.constructor)
    ).to.deep.equal([Ore, Fruit]);
    expect(terrainFeatureRegistry.getByTerrain(from)).to.deep.equal([]);
  });

  it('should leave the features alone when no rule moves them', (): void => {
    const terrainFeatureRegistry = new TerrainFeatureRegistry(),
      [tile, from] = complete(new RuleRegistry(), terrainFeatureRegistry);

    expect(terrainFeatureRegistry.getByTerrain(tile.terrain())).to.deep.equal(
      []
    );
    expect(
      terrainFeatureRegistry
        .getByTerrain(from)
        .map((feature: TerrainFeature) => feature.constructor)
    ).to.deep.equal([Ore, Fruit]);
  });

  it('should roll for a Shield on the new terrain, before `TerrainChanged`', (): void => {
    const ruleRegistry = new RuleRegistry(),
      seen: string[] = [];

    ruleRegistry.register(
      new Feature(
        new Effect(
          (FeatureType: typeof TerrainFeature, terrain: Terrain): void => {
            seen.push(
              `Feature ${FeatureType === Shield} ${
                terrain instanceof Grassland
              }`
            );
          }
        )
      ),
      new TerrainChanged(
        new Effect((tile: Tile, from: Terrain, to: Terrain): void => {
          seen.push(`TerrainChanged ${tile.terrain() === to}`);
        })
      )
    );

    complete(ruleRegistry, new TerrainFeatureRegistry());

    expect(seen).to.deep.equal(['Feature true true', 'TerrainChanged true']);
  });
});
