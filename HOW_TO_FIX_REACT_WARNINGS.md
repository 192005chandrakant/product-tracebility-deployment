# How to Fix React Unknown Prop Warnings

The React console warning about unknown props is a common issue when custom props are passed to native DOM elements. This document provides solutions to fix these warnings.

## Common Warning Pattern

```
Warning: React does not recognize the `someProp` prop on a DOM element. 
If you intentionally want it to appear in the DOM as a custom attribute, 
spell it as lowercase `someprop` instead. 
If you accidentally passed it from a parent component, remove it from the DOM element.
```

## Fixing Approach

We've added a utility file `src/utils/reactUtils.js` with two helper functions to filter out custom props:

1. `filterDOMProps` - Removes specified props from being passed to DOM elements
2. `getDOMProps` - Only allows known valid DOM props to be passed

## Usage Examples

### Example 1: Using filterDOMProps

```jsx
import { filterDOMProps } from '../utils/reactUtils';

function CustomButton(props) {
  // Filter out custom props that shouldn't go to the DOM
  const domProps = filterDOMProps(props, ['customProp', 'variant']);
  
  return <button {...domProps}>{props.children}</button>;
}
```

### Example 2: Using getDOMProps

```jsx
import { getDOMProps } from '../utils/reactUtils';

function CustomInput(props) {
  // Only include valid DOM properties
  const domProps = getDOMProps(props);
  
  return <input {...domProps} />;
}
```

## Components to Update

Based on the console warnings, the following components should be updated to filter props:

1. `ErrorBoundary.js` - Filter any custom props before passing to DOM elements
2. `Layout.js` - Ensure motion components don't pass non-standard props to DOM elements
3. `FloatingCubeWrapper.js` - Filter props being passed to DOM elements
4. Any other components showing prop warnings in the console

## Implementation Steps

1. Import the utility function:
   ```jsx
   import { filterDOMProps, getDOMProps } from '../utils/reactUtils';
   ```

2. Apply to components with warnings:
   ```jsx
   // Before
   <div customProp={value} className="some-class">...</div>
   
   // After
   <div {...getDOMProps({ className: "some-class" })}></div>
   
   // Or
   const domProps = filterDOMProps(props, ['customProp']);
   <div {...domProps}>...</div>
   ```

3. For third-party components like those from framer-motion, check if they have their own prop filtering methods or wrap them with custom components that filter props.

By applying these techniques consistently across your codebase, you'll eliminate React warnings about unknown props.
