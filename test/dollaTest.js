import test, { suite, after } from 'node:test';
import assert from 'node:assert';
import State from '../state.js';
import { setAttribute } from 'dolla';
import '../plugins/dolla.js';

suite('dolla', () => {
    after(() => {
        State.disconnect();
    });
    test('setAttribute.setValue', function () {
        const toggle = new State(true)
        const el = document.createElement('input')
        setAttribute(el, 'type', 'checkbox')
        setAttribute(el, 'checked', toggle)
        assert(el.checked)
        toggle.set(false)
        assert(!el.checked)
    });

    test('setAttribute.setContent', function () {
        const content = new State('Hello')
        const el = document.createElement('div')
        setAttribute(el, 'content', content)
        assert.equal('<div>Hello</div>', el.outerHTML)
        content.set('World')
        assert.equal('<div>World</div>', el.outerHTML)
        content.set('<span>World</span>')
        assert.equal('<span>World</span>', el.querySelector('span').outerHTML)
    });


    test('setAttribute.setClass', function () {
        const klass = new State('bg-white')
        const el = document.createElement('div')
        el.classList.add('border-blue')
        setAttribute(el, 'class', klass)
        assert(el.classList.contains('bg-white'))
        klass.set('bg-black')
        assert(el.classList.contains('bg-black'))
        assert(!el.classList.contains('bg-white'))
        assert(!el.classList.contains('border-blue'))
    });

    test('setAttribute.setClass with array containing State', function () {
        const klass = new State('bg-white')
        const el = document.createElement('div')
        setAttribute(el, 'class', ['border-blue', klass])
        assert.equal("border-blue bg-white", el.className)
        klass.set('bg-black')
        assert.equal("border-blue bg-black", el.className)
    });
    
    test('setAttribute.setData', function () {
        const data = new State({name: 'Rod', job: 'Stunt Man'})
        const el = document.createElement('div')
        setAttribute(el, 'data', data)
        assert.equal("<div data-name=\"Rod\" data-job=\"Stunt Man\"></div>", el.outerHTML)
        data.set({name: 'Rod Kimble', job: 'Stunt Man'})
        assert.equal("<div data-name=\"Rod Kimble\" data-job=\"Stunt Man\"></div>", el.outerHTML)
    });
    
    test('setAttribute.setData with object containing State', function () {
        const userName = new State('Rod')
        const el = document.createElement('div')
        setAttribute(el, 'data', {name: userName, job: 'Stunt Man'})
        assert.equal("<div data-name=\"Rod\" data-job=\"Stunt Man\"></div>", el.outerHTML)
        userName.set('Rod Kimble')
        assert.equal("<div data-name=\"Rod Kimble\" data-job=\"Stunt Man\"></div>", el.outerHTML)
    });
    
    test('setAttribute.setStyle', function () {
        const style = new State({background: 'blue', display: 'block'})
        const el = document.createElement('div')
        setAttribute(el, 'style', style)
        assert.equal("<div style=\"background: blue; display: block;\"></div>", el.outerHTML)
        style.set({background: 'blue', display: 'none', padding: '1em'})
        assert.equal("<div style=\"background: blue; display: none; padding: 1em;\"></div>", el.outerHTML)
    });
    
    test('setAttribute.setStyle with object containing State', function () {
        const bg = new State('blue')
        const el = document.createElement('div')
        setAttribute(el, 'style', {background: bg, display: 'block'})
        assert.equal("<div style=\"background: blue; display: block;\"></div>", el.outerHTML)
        bg.set('red')
        assert.equal("<div style=\"background: red; display: block;\"></div>", el.outerHTML)
    });
})