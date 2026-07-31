import test, { suite } from 'node:test';
import assert from 'node:assert';
import State from '../state.js';
import { Record } from 'viking';
import { belongsTo, hasMany } from 'viking/record/associations';
import '../plugins/viking.js';

class Ship extends Record {
    static schema = {
        id: { type: 'integer' },
        name: { type: 'string' }
    };
}

class Fleet extends Record {
    static schema = {
        id: { type: 'integer' },
        name: { type: 'string' }
    };

    static associations = [
        hasMany('ships', { model: Ship })
    ];
}

class Captain extends Record {
    static schema = {
        id: { type: 'integer' },
        name: { type: 'string' },
        ship_id: { type: 'integer' }
    };

    static associations = [
        belongsTo('ship', { model: Ship })
    ];
}

suite('viking', () => {
    test('state returns a State for an attribute', function () {
        const ship = new Ship({ name: 'Black Pearl' });
        const nameState = ship.state('name');
        assert(nameState instanceof State);
        assert.equal(nameState.value, 'Black Pearl');
    });

    test('state returns the same State on repeated calls', function () {
        const ship = new Ship({ name: 'Black Pearl' });
        const first = ship.state('name');
        const second = ship.state('name');
        assert.strictEqual(first, second);
    });

    test('state updates when attribute changes', function () {
        const ship = new Ship({ name: 'Black Pearl' });
        const nameState = ship.state('name');
        assert.equal(nameState.value, 'Black Pearl');
        ship.name = 'Flying Dutchman';
        assert.equal(nameState.value, 'Flying Dutchman');
    });

    test('state for belongsTo association', function () {
        const ship = new Ship({ id: 1, name: 'Black Pearl' });
        const captain = new Captain({ name: 'Jack', ship: ship });
        const shipState = captain.state('ship');
        assert(shipState instanceof State);
        assert.equal(shipState.value, ship);
    });

    test('state updates when belongsTo association changes', function () {
        const ship1 = new Ship({ id: 1, name: 'Black Pearl' });
        const ship2 = new Ship({ id: 2, name: 'Flying Dutchman' });
        const captain = new Captain({ name: 'Jack', ship: ship1 });
        const shipState = captain.state('ship');
        assert.equal(shipState.value, ship1);
        captain.ship = ship2;
        assert.equal(shipState.value, ship2);
    });

    test('state notifies when a hasMany association changes', function () {
        const fleet = new Fleet({ id: 1, name: 'Armada' });
        const ships = fleet.association('ships');
        const shipsState = fleet.state('ships');

        let calls = 0;
        const listener = () => calls++;
        shipsState.addListener(listener);

        ships.setTarget([new Ship({ id: 1, name: 'Black Pearl' })]);
        assert.equal(calls, 1);
        assert.equal(shipsState.value.length, 1);

        ships.setTarget([]);
        assert.equal(calls, 2);
        assert.equal(shipsState.value.length, 0);
    });
});
