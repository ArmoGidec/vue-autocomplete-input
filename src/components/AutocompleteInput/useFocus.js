export const useFocus = (states) => {
  const handleFocus = () => {
    states.isFocused = true;
  };
  const handleBlur = () => {
    // states.isFocused = false;
  };

  return {
    handleFocus,
    handleBlur,
  };
};
