<img src="https://raw.githubusercontent.com/bemky/state/master/state.png" width="300" alt="State">

State API is a javascript interface for storing values and managing callbacks for changes to those values


## Installation
    npm install github:bemky/state

```javascript
import State from 'state';
```

## Example
```javascript
const filter = new State({type: 'active'})
filter.addListener((filter, filterWas) => {
    collection.where(filter)
})

filter.set({type: 'pending'})
```

## Properties
### `value`
The root value of the state. The State uses value for `valueOf`, but in some cases you'll still need to use the actual value.

```javascript
isOpen = new State(true)
if (isOpen == true) {} // works
if (isOpen.value) {} // works
if (isOpen) {} // does not work
```

### `isState`
Always true, helps frameworks identify a `State`.

```javascript
if (typeof attribute == 'object' && attribute.isState) {}
```

## Methods
### `set(value)`
Removes and added callback
```javascript
isOpen = new State(true)
isOpen.set(false)
```

### `addListener(callback:function)`
Add a callback to be run when value changes
```javascript
addListener((oldValue, newValue, metadata) => {})
```

### `removeListener(callback:function)`
Removes and added callback
```javascript
function callback (oldValue, newValue, metadata) {} 
addListener(callback)
removeListener(callback)
```

### `transform(transformation:function)`
Returns a new State that follows changes to this State, with the transformation applied to value everytime it changes
```javascript
projectName = new State()
isSet = projectName.transform(v => v != null && v != undefined)
isSet.addListener(v => { console.log(isSet.value)})
projectName.set('New WIP')
// log: true
```

## Plugins
### [Dolla](https://dollajs.com/)
State works great with [Dolla](https://dollajs.com/). This plugin modifies the `setAttribute` method to setup listeners when passing State values.

```javascript
import { createElement } from 'dolla';
import 'state/plugins/dolla'

const bg = new State('white')
const el = createElement({
    style: {
        background: bg
    }
})

bg.set('black')
el.style.background // >> black

```

### TODO
- [ ] Viking
- [ ] EJX
- [ ] Komps