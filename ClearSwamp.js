"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClearSwamp = exports.COMPLETE = void 0;
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const TerrainFeatureRegistry_1 = require("@civ-clone/core-terrain-feature/TerrainFeatureRegistry");
const Turn_1 = require("@civ-clone/core-turn-based-game/Turn");
const ClearingSwamp_1 = require("./Rules/ClearingSwamp");
const DelayedAction_1 = require("@civ-clone/core-unit/DelayedAction");
const Moved_1 = require("@civ-clone/core-unit/Rules/Moved");
const MovementCost_1 = require("@civ-clone/core-unit/Rules/MovementCost");
const Grassland_1 = require("@civ-clone/base-terrain-grassland/Grassland");
const registerDelayedAction_1 = require("@civ-clone/core-unit/registerDelayedAction");
const Feature_1 = require("@civ-clone/core-terrain-feature/Rules/Feature");
const Shield_1 = require("@civ-clone/base-terrain-feature-shield/Shield");
exports.COMPLETE = 'base-unit-action-clear-swamp:complete';
class ClearSwamp extends DelayedAction_1.default {
    constructor(from, to, unit, ruleRegistry = RuleRegistry_1.instance, terrainFeatureRegistry = TerrainFeatureRegistry_1.instance, turn = Turn_1.instance) {
        super(from, to, unit, ruleRegistry, turn);
        this._terrainFeatureRegistry = terrainFeatureRegistry;
    }
    perform() {
        const [moveCost] = this.ruleRegistry()
            .process(MovementCost_1.default, this.unit(), this)
            .sort((a, b) => b - a);
        super.perform(moveCost, exports.COMPLETE, ClearingSwamp_1.default);
        this.ruleRegistry().process(Moved_1.default, this.unit(), this);
    }
}
exports.ClearSwamp = ClearSwamp;
// Registered here rather than passed to `perform` as a closure: a closure
// cannot be written to a file, which is why a unit part-way through this could
// not be saved. `this.from()` becomes `unit.tile()` — the same tile, since
// `isCurrentTile` is one of this action's criteria — and the registries come
// from their singletons rather than the action instance.
(0, registerDelayedAction_1.default)({
    BusyRule: ClearingSwamp_1.default,
    handler: exports.COMPLETE,
    action: (unit) => new ClearSwamp(unit.tile(), unit.tile(), unit),
    complete: (unit) => {
        const terrain = new Grassland_1.default(), features = TerrainFeatureRegistry_1.instance.getByTerrain(unit.tile().terrain());
        RuleRegistry_1.instance.process(Feature_1.default, Shield_1.default, terrain);
        TerrainFeatureRegistry_1.instance.unregister(...features);
        unit.tile().setTerrain(terrain);
    },
});
exports.default = ClearSwamp;
//# sourceMappingURL=ClearSwamp.js.map