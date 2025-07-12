/**
 * Utility function to filter React props
 * Helps prevent "Warning: React does not recognize the xx prop on a DOM element"
 * 
 * Usage:
 * const domProps = filterDOMProps(props, ['customProp1', 'customProp2']);
 * return <div {...domProps}>Content</div>;
 */
export function filterDOMProps(props, excludeList = []) {
  // Always exclude these props that React warns about
  const defaultExclude = [
    'innerRef',
    'customProp',
    'theme',
    'variant',
    'as',
    'size',
    'active',
    'enableAnimation',
  ];
  
  const allExcludes = [...defaultExclude, ...excludeList];
  
  return Object.fromEntries(
    Object.entries(props).filter(([key]) => !allExcludes.includes(key))
  );
}

/**
 * Utility function to filter out non-DOM props from component props
 * and returns only valid DOM props and aria-* props, and data-* props
 * 
 * @param {Object} props - Component props
 * @returns {Object} - Filtered props safe for DOM elements
 */
export function getDOMProps(props) {
  const domProps = {};

  // Common DOM props to allow
  const validProps = [
    // Basic props
    'id', 'className', 'style', 'title', 'tabIndex', 'lang', 'dir',
    
    // Form props
    'name', 'value', 'defaultValue', 'checked', 'defaultChecked', 'disabled',
    'required', 'readOnly', 'placeholder', 'autoFocus', 'autoComplete',
    'type', 'accept', 'alt', 'capture', 'form', 'formAction', 'formEncType',
    'formMethod', 'formTarget', 'formNoValidate', 'multiple',
    
    // Events
    'onClick', 'onChange', 'onSubmit', 'onBlur', 'onFocus', 'onKeyDown',
    'onKeyUp', 'onKeyPress', 'onMouseEnter', 'onMouseLeave', 'onMouseOver',
    'onMouseOut', 'onMouseDown', 'onMouseUp', 'onScroll', 'onWheel',
    'onDragStart', 'onDrag', 'onDragEnd', 'onDrop'
  ];
  
  // Filter valid props
  Object.keys(props).forEach(key => {
    if (
      validProps.includes(key) || 
      key.startsWith('aria-') || 
      key.startsWith('data-')
    ) {
      domProps[key] = props[key];
    }
  });
  
  return domProps;
}
