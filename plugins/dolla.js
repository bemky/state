import State from '../state.js';
import { setAttribute } from 'dolla';

State.listeningReferences = new Set
State.cleanupReferences = function () {
    State.listeningReferences.forEach(entry => {
        if (!entry.el.parentElement) {
            entry.state.removeListener(entry.callback)
            State.listeningReferences.delete(entry)
        }
    })
}
State.cleanupDelay = 5000
State.cleanupInterval = setInterval(() => State.cleanupReferences, State.cleanupDelay)
State.disconnect = function () {
    clearInterval(State.cleanupInterval)
}

function addListenerAndObserve (state, el, callback) {
    state.addListener(callback)
    State.listeningReferences.add({el, callback, state})
}

const setWas = setAttribute.set
setAttribute.set = function (el, key, value, ...args) {
    if (value?.isState) {
        addListenerAndObserve(value, el, v => setWas.call(this, el, key, v, ...args))
        setWas.call(this, el, key, value.value, ...args)
    } else {
        setWas.call(this, el, key, value, ...args)
    }
}

// Deeply setup style properties to listen
const styleSetPropertyWas = setAttribute.setStyle.setProperty
setAttribute.setStyle.setProperty = function (el, key, value, ...args) {
    if (value?.isState) {
        addListenerAndObserve(value, el, v => styleSetPropertyWas.call(this, el, key, v, ...args))
        styleSetPropertyWas.call(this, el, key, value.value, ...args)
    } else {
        styleSetPropertyWas.call(this, el, key, value, ...args)
    }
}

// Deeply setup classes to toggle properties to listen
const setClassForEachWas = setAttribute.setClass.forEach
setAttribute.setClass.forEach = function (el, token) {
    if (token?.isState) {
        addListenerAndObserve(token, el, (now, was) => {
            el.classList.replace(was, now)
        })
        setClassForEachWas.call(this, el, token.value)
    } else {
        setClassForEachWas.call(this, el, token)
    }
}

// Deeply setup data properties to listen
const setDataForEachWas = setAttribute.setData.forEach
setAttribute.setData.forEach = function (el, key, value, ...args) {
    if (value?.isState) {
        addListenerAndObserve(value, el, v => setDataForEachWas.call(this, el, key, v, ...args))
        setDataForEachWas.call(this, el, key, value.value, ...args)
    } else {
        setDataForEachWas.call(this, el, key, value, ...args)
    }
}