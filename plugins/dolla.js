import State from '../state.js';
import { setAttribute, insertBefore, remove, toNodes } from 'dolla';

State.listeningReferences = new Set
State.cleanupReferences = function () {
    State.listeningReferences.forEach(entry => {
        if (entry.els.every(el => !el.isConnected)) {
            entry.state.removeListener(entry.callback)
            State.listeningReferences.delete(entry)
        }
    })
}
State.cleanupDelay = 5000
State.cleanupInterval = setInterval(State.cleanupReferences, State.cleanupDelay)
State.disconnect = function () {
    clearInterval(State.cleanupInterval)
}

function addListenerAndObserve (state, callback, ...els) {
    state.addListener(callback)
    const entry = { els, callback, state }
    State.listeningReferences.add(entry)
    return entry
}

const fromObjectWas = toNodes.fromObject
toNodes.fromObject = function (obj, ...args) {
    if (State.isState(obj)) {
        const start = document.createComment('state-start')
        const end = document.createComment('state-end')

        const entry = addListenerAndObserve(obj, () => {
            const content = toNodes(obj.value)
            entry.els.splice(1, entry.els.length - 2, ...content)
            
            if (!start.parentNode || !end.parentNode) return
            const range = document.createRange()
            range.setStartAfter(start)
            range.setEndBefore(end)
            range.deleteContents()
            end.before(...content)
        }, start, end)
        
        entry.callback()
        
        return entry.els
    } else {
        return fromObjectWas.call(this, obj, ...args)
    }
}

const setWas = setAttribute.set
setAttribute.set = function (el, key, value, ...args) {
    if (State.isState(value)) {
        addListenerAndObserve(value, v => setWas.call(this, el, key, v, ...args), el)
        setWas.call(this, el, key, value.value, ...args)
    } else {
        setWas.call(this, el, key, value, ...args)
    }
}

// Deeply setup style properties to listen
const styleSetWas = setAttribute.setStyle
setAttribute.setStyle = function (el, key, value, ...args) {
    if (State.isState(value)) {
        addListenerAndObserve(value, v => styleSetWas.call(this, el, key, v, ...args), el)
        styleSetWas.call(this, el, key, value.value, ...args)
    } else {
        styleSetWas.call(this, el, key, value, ...args)
    }
}

// Deeply setup classes to toggle properties to listen
const addClassWas = setAttribute.addClass
setAttribute.addClass = function (el, token) {
    if (State.isState(token)) {
        addListenerAndObserve(token, (now, was) => {
            now = now.split(" ")
            was = was.split(" ")
            if (now.length == 1 && was.length == 1) {
                el.classList.replace(was[0], now[0])
            } else {
                el.classList.remove(...was)
                el.classList.add(...now)
            }
        }, el)
        addClassWas.call(this, el, token.value)
    } else {
        addClassWas.call(this, el, token)
    }
}

// Deeply setup data properties to listen
const setDataWas = setAttribute.setData
setAttribute.setData = function (el, key, value, ...args) {
    if (State.isState(value)) {
        addListenerAndObserve(value, v => setDataWas.call(this, el, key, v, ...args), el)
        setDataWas.call(this, el, key, value.value, ...args)
    } else {
        setDataWas.call(this, el, key, value, ...args)
    }
}