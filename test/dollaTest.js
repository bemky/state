import test, { suite, after } from 'node:test';
import assert from 'node:assert';
import State from '../state.js';
import { setAttribute, toNodes, createElement } from 'dolla';
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
    
    test('setAttribute.setContent with State nested deep in content', function () {
        const activeChat = new State('Hello World')
        const el = document.createElement('div')
        setAttribute(el, 'class', 'flex-1 flex flex-col min-w-0')
        setAttribute(el, 'content', [
            {tag: 'div', class: 'flex-1 overflow-y-auto px-2 py-4', id: 'chat-messages', content: [
                activeChat.transform(function (chat) {
                    return {tag: 'p', content: chat}
                })
            ]}
        ])
        assert.equal(el.querySelector('#chat-messages p').textContent, 'Hello World')
        activeChat.set('Goodbye World')
        assert.equal(el.querySelector('#chat-messages p').textContent, 'Goodbye World')
    });

    test('setAttribute.setContent removes old content on state change', function () {
        const items = new State([
            {tag: 'li', content: 'one'},
            {tag: 'li', content: 'two'},
            {tag: 'li', content: 'three'}
        ])
        const el = document.createElement('ul')
        document.body.append(el)
        setAttribute(el, 'content', [items.transform(function (v) {
            return v
        })])
        assert.equal(el.querySelectorAll('li').length, 3)
        items.set([{tag: 'li', content: 'only'}])
        assert.equal(el.querySelectorAll('li').length, 1)
        assert.equal(el.querySelector('li').textContent, 'only')
        items.set([])
        assert.equal(el.querySelectorAll('li').length, 0)
        el.remove()
    });

    test('setAttribute.setContent does not throw when state changes while a bookend comment is unparented', function () {
        // Reproduces the Firefox-reported bug: during a custom element's
        // connectedCallback, the bookend `end` comment can still be
        // unparented (only `start` has been appended) when a synchronous
        // state mutation fires the listener. Real browsers throw
        // "The supplied node is incorrect or has an incorrect ancestor
        // for this operation." on Range.setEndBefore in that state.
        // happy-dom is lenient about Range on unparented nodes, so patch
        // createRange here to mirror the spec.
        const createRangeWas = document.createRange.bind(document)
        document.createRange = function () {
            const range = createRangeWas()
            const setStartAfterWas = range.setStartAfter.bind(range)
            const setEndBeforeWas = range.setEndBefore.bind(range)
            const guard = (node) => {
                if (!node.parentNode) throw new DOMException(
                    'The supplied node is incorrect or has an incorrect ancestor for this operation.',
                    'InvalidNodeTypeError'
                )
            }
            range.setStartAfter = function (node) { guard(node); return setStartAfterWas(node) }
            range.setEndBefore = function (node) { guard(node); return setEndBeforeWas(node) }
            return range
        }
        try {
            const content = new State('one')
            const el = document.createElement('div')
            document.body.append(el)
            setAttribute(el, 'content', [content.transform(v => v)])
            // Simulate the mid-render state: only `start` is attached.
            const end = Array.from(el.childNodes).find(n => n.nodeType === 8 && n.data === 'state-end')
            end.remove()
            assert.doesNotThrow(() => {
                content.set('two')
            })
            el.remove()
        } finally {
            document.createRange = createRangeWas
        }
    });

    test('setAttribute.setContent with State initially empty then renders content', function () {
        const items = new State([])
        const el = document.createElement('ul')
        document.body.append(el)
        setAttribute(el, 'content', [items.transform(function (v) {
            return v
        })])
        assert.equal(el.querySelectorAll('li').length, 0)
        items.set([{tag: 'li', content: 'first'}, {tag: 'li', content: 'second'}])
        assert.equal(el.querySelectorAll('li').length, 2)
        assert.equal(el.querySelector('li').textContent, 'first')
        el.remove()
    });

    test('setAttribute.setContent updates while detached then renders on attach', function () {
        const content = new State('first')
        const els = toNodes(content.transform(v => createElement({tag: 'p', content: v})))
        content.set('second')
        const el = document.createElement('div')
        el.append(...els)
        assert.equal(el.querySelector('p').textContent, 'second')
    });

    test('setAttribute.setContent in array', function () {
        const content = new State('world')
        const el = document.createElement('div')
        setAttribute(el, 'content', [
            {tag: 'strong', content: 'hello'},
            content
        ])
        assert.equal('<div><strong>hello</strong><!--state-start-->world<!--state-end--></div>', el.outerHTML)
        content.set('world!')
        assert.equal('<div><strong>hello</strong><!--state-start-->world!<!--state-end--></div>', el.outerHTML)
        content.set('<span>world</span>')
        assert.equal('<div><strong>hello</strong><!--state-start--><span>world</span><!--state-end--></div>', el.outerHTML)
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
    
    test('setAttribute.setClass with array containing strings', function () {
        const klass = new State('bg-white')
        const el = document.createElement('div')
        setAttribute(el, 'class', ['border-blue', klass])
        assert.equal("border-blue bg-white", el.className)
        klass.set('bg-black hello-world')
        assert.equal("border-blue bg-black hello-world", el.className)
    });

    test('setAttribute.setClass with array containing State that becomes empty', function () {
        const klass = new State('bg-white')
        const el = document.createElement('div')
        setAttribute(el, 'class', ['border-blue', klass])
        assert.equal("border-blue bg-white", el.className)
        klass.set('')
        assert.equal("border-blue", el.className)
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

    test('cleanup removes listener for setValue', function () {
        const toggle = new State(true)
        const el = document.createElement('input')
        document.body.append(el)
        setAttribute(el, 'type', 'checkbox')
        setAttribute(el, 'checked', toggle)
        assert.equal(toggle.listens.size, 1)
        el.remove()
        State.cleanupReferences()
        assert.equal(toggle.listens.size, 0)
    });

    test('cleanup removes listener for setStyle', function () {
        const bg = new State('blue')
        const el = document.createElement('div')
        document.body.append(el)
        setAttribute(el, 'style', {background: bg})
        assert.equal(bg.listens.size, 1)
        el.remove()
        State.cleanupReferences()
        assert.equal(bg.listens.size, 0)
    });

    test('cleanup removes listener for setClass', function () {
        const klass = new State('bg-white')
        const el = document.createElement('div')
        document.body.append(el)
        setAttribute(el, 'class', klass)
        assert.equal(klass.listens.size, 1)
        el.remove()
        State.cleanupReferences()
        assert.equal(klass.listens.size, 0)
    });

    test('cleanup removes listener for setData', function () {
        const name = new State('Rod')
        const el = document.createElement('div')
        document.body.append(el)
        setAttribute(el, 'data', {name: name})
        assert.equal(name.listens.size, 1)
        el.remove()
        State.cleanupReferences()
        assert.equal(name.listens.size, 0)
    });

    test('cleanup removes listener for setContent', function () {
        const content = new State('Hello')
        const el = document.createElement('div')
        document.body.append(el)
        setAttribute(el, 'content', content)
        assert.equal(content.listens.size, 1)
        el.remove()
        State.cleanupReferences()
        assert.equal(content.listens.size, 0)
    });

    test('cleanup removes listener for setContent in array', function () {
        const content = new State('world')
        const el = document.createElement('div')
        document.body.append(el)
        setAttribute(el, 'content', [
            {tag: 'strong', content: 'hello'},
            content
        ])
        assert.equal(content.listens.size, 1)
        el.remove()
        State.cleanupReferences()
        assert.equal(content.listens.size, 0)
    });

    test('cleanup preserves a transform spawn when referenced', function () {
        const source = new State('active')
        const sourceToggle = source.transform(v => v === 'active' ? 'on' : 'off')
        const el = createElement({content: sourceToggle})
        source.set('inactive')
        assert.equal(el.innerHTML, 'off')
        el.remove()
        State.cleanupReferences()
        source.set('active')
        const el2 = createElement({content: sourceToggle})
        assert.equal(el2.innerHTML, 'on')
    });

    test('an unreferenced transform spawn is pruned from its source after GC', {
        skip: typeof global.gc !== 'function' ? 'run with --expose-gc' : false
    }, async function () {
        const source = new State('active')
        let spawn = source.transform(v => v === 'active' ? 'on' : 'off')
        // bind + unbind it so dolla isn't holding it via listeningReferences
        const el = document.createElement('div')
        document.body.append(el)
        setAttribute(el, 'class', spawn)
        el.remove()
        State.cleanupReferences()
        assert.equal(source.listens.size, 1) // still subscribed — not eagerly severed
        spawn = null                          // drop the only strong reference
        for (let i = 0; i < 10 && source.listens.size > 0; i++) {
            global.gc()
            await new Promise(r => setTimeout(r, 10))
        }
        assert.equal(source.listens.size, 0) // FinalizationRegistry pruned the dead listener
    });
})