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
    static complete(action) {
        const terrain = new ClearSwamp.result(), features = action._terrainFeatureRegistry.getByTerrain(action.from().terrain());
        action.ruleRegistry().process(Feature_1.default, Shield_1.default, terrain);
        action._terrainFeatureRegistry.unregister(...features);
        action.from().setTerrain(terrain);
    }
}
exports.ClearSwamp = ClearSwamp;
// The terrain finishing leaves behind, used by `complete` and read by the UI to show what the action will do. Static
//  because a public instance member would make the class unassignable to `Action` (see `complete`).
ClearSwamp.result = Grassland_1.default;
// Registered here rather than passed to `perform` as a closure: a closure
// cannot be written to a file, which is why a unit part-way through this could
// not be saved. The behaviour itself stays on the action, in `complete()`.
(0, registerDelayedAction_1.default)({
    BusyRule: ClearingSwamp_1.default,
    handler: exports.COMPLETE,
    action: (unit) => new ClearSwamp(unit.tile(), unit.tile(), unit),
    complete: (unit, pendingEffect, action) => ClearSwamp.complete(action),
});
exports.default = ClearSwamp;
//# sourceMappingURL=ClearSwamp.js.map