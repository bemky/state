import { setAttribute } from 'dolla';

const setWas = setAttribute.set
setAttribute.set = function (el, key, value, ...args) {
    if (value?.isState) {
        value.addListener(v => setWas.call(this, el, key, v, ...args))
        setWas.call(this, el, key, value.value, ...args)
    } else {
        setWas.call(this, el, key, value, ...args)
    }
}

// Deeply setup style properties to listen
const styleSetPropertyWas = setAttribute.setStyle.setProperty
setAttribute.setStyle.setProperty = function (el, key, value, ...args) {
    if (value?.isState) {
        value.addListener(v => styleSetPropertyWas.call(this, el, key, v, ...args))
        styleSetPropertyWas.call(this, el, key, value.value, ...args)
    } else {
        styleSetPropertyWas.call(this, el, key, value, ...args)
    }
}

// Deeply setup classes to toggle properties to listen
const setClassForEachWas = setAttribute.setClass.forEach
setAttribute.setClass.forEach = function (el, token) {
    if (token?.isState) {
        token.addListener((now, was) => {
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
        value.addListener(v => setDataForEachWas.call(this, el, key, v, ...args))
        setDataForEachWas.call(this, el, key, value.value, ...args)
    } else {
        setDataForEachWas.call(this, el, key, value, ...args)
    }
}