import test from 'node:test';
import assert from 'node:assert';
import State from '../state.js';

test('get', function () {
    const isOpen = new State(true)
    assert.equal(true, isOpen.value)
});

test('set', function () {
    const isOpen = new State(true)
    isOpen.set(false)
    assert.equal(false, isOpen.value)
});

test('addListener', function () {
    const isOpen = new State('foo')
    let pass = false
    isOpen.addListener(() => pass = true)
    isOpen.set('bar')
    assert.ok(pass)
});

test('removeListener', function () {
    const isOpen = new State('foo')
    let test = 'foo'
    const callback = v => test = v
    isOpen.addListener(callback)
    isOpen.set('bar')
    assert.equal(test, 'bar')
    isOpen.removeListener(callback)
    isOpen.set('charlie')
    assert.equal(test, 'bar')
});

test('valueOf', function () {
    const isOpen = new State(11)
    assert.ok(isOpen > 10)
});

test('transform', function() {
    const isOpen = new State(true)
    const isOpenClass = isOpen.transform(v => !!v ? '-show' : '-hide')
    assert.equal(isOpenClass, '-show')
    isOpen.set(false)
    assert.equal(isOpenClass, '-hide')
})

test('transform updates through chained transforms', function() {
    const count = new State(1)
    const doubled = count.transform(v => v * 2)
    const label = doubled.transform(v => `=${v}`)
    assert.equal(label.value, '=2')
    count.set(5)
    assert.equal(doubled.value, 10)
    assert.equal(label.value, '=10')
})

test('static isState', function() {
    const isOpen = new State(true)
    const foo = 1
    assert.ok(State.isState(isOpen))
    assert.ok(!State.isState(foo))
})