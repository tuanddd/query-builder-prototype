import { useEffect, useRef, useState } from 'react';
import { render } from 'react-dom';
import { useCombobox } from 'downshift';
import {
  items,
  Item,
  fieldOptions,
  operatorOptions,
  booleanOptions,
  operatorMapping,
} from './shared';
import './index.css';
import {
  Code,
  Box,
  IconButton,
  TextInput,
  usePopper,
  Portal,
} from '@sajari-ui/core';

const ItemRender = ({
  item,
  shouldFocus,
  onChange,
  onRemove,
}: {
  item: Item;
  shouldFocus: boolean;
  onChange: (item: Item) => void;
  onRemove: () => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (shouldFocus) {
      inputRef.current?.focus();
    }
  }, [shouldFocus]);

  if (item.type === 'field') {
    return (
      <Box as="span" textColor="text-gray-500">
        {item.value}
      </Box>
    );
  }

  if (item.type === 'operator') {
    return <Box as="span">{operatorMapping[item.value]}</Box>;
  }

  if (item.type === 'value') {
    if (item.component === 'text') {
      return (
        <TextInput
          ref={inputRef}
          value={item.value}
          padding="py-0"
          borderWidth="border-0"
          width="w-max-content"
          backgroundColor={['bg-transparent', 'focus:bg-white']}
          onChange={(e) => {
            onChange({ ...item, value: e.target.value });
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && item.value === '') {
              onRemove();
            }
          }}
        />
      );
    }

    if (item.component === 'boolean') {
      return <Box as="span">{item.value}</Box>;
    }
  }

  return null;
};

function DropdownMultipleCombobox() {
  const [inputValue, setInputValue] = useState('');
  const [selectedItems, setSelectedItems] = useState<Item[]>([
    items[0],
    items[1],
    items[2],
  ]);

  const [hoverIndexes, setHoverIndexes] = useState<number[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const addSelectedItem = (item) => {
    setSelectedItems((prev) => [...prev, item]);
  };

  const getFilteredItems = (items) => {
    return items.filter((item) =>
      item?.text?.toLowerCase().startsWith(inputValue.toLowerCase()),
    );
  };

  const type = selectedItems[selectedItems.length - 1]?.type;
  const endFieldOption = fieldOptions.find(
    (o) => o.text === selectedItems[selectedItems.length - 2]?.value,
  );
  const endItem = selectedItems[selectedItems.length - 1];

  const suggestions =
    type === undefined || type === 'value'
      ? fieldOptions
      : type === 'field'
      ? operatorOptions
      : endFieldOption?.type === 'BOOLEAN'
      ? booleanOptions
      : [];

  const filteredSuggestions = getFilteredItems(suggestions);

  const {
    isOpen,
    getMenuProps,
    getInputProps,
    getComboboxProps,
    highlightedIndex,
    getItemProps,
    selectItem,
    openMenu,
    setHighlightedIndex,
  } = useCombobox({
    inputValue,
    items: filteredSuggestions,
    onStateChange: ({ inputValue, type, selectedItem }) => {
      switch (type) {
        case useCombobox.stateChangeTypes.InputChange:
          // @ts-ignore
          setInputValue(inputValue);
          break;

        case useCombobox.stateChangeTypes.InputKeyDownEnter:
        case useCombobox.stateChangeTypes.ItemClick:
        case useCombobox.stateChangeTypes.InputBlur:
          if (selectedItem) {
            if (!endItem || endItem?.type === 'value') {
              // @ts-ignore
              addSelectedItem({
                type: 'field',
                // @ts-ignore
                value: selectedItem.value,
                // @ts-ignore
                fieldType: selectedItem.type,
              });
              openMenu();
            } else if (endItem?.type === 'field') {
              // @ts-ignore
              addSelectedItem({ type: 'operator', value: selectedItem.value });
              openMenu();
            } else if (
              endItem?.type === 'operator' &&
              endFieldOption?.type === 'BOOLEAN'
            ) {
              openMenu();
              // @ts-ignore
              addSelectedItem({
                type: 'value',
                // @ts-ignore
                value: selectedItem.value,
                component: 'boolean',
              });
            }
            setInputValue('');
            selectItem(null);
          }

          break;
        default:
          break;
      }
    },
  });
  const [focusIndex, setFocusIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const [lastItem, setLastItem] = useState<null | Item>(null);

  useEffect(() => {
    if (lastItem) {
      setInputValue(lastItem.value.substring(0, lastItem.value.length - 1));
      inputRef.current?.focus();
    }
  }, [lastItem]);

  useEffect(() => {
    wrapperRef.current?.scroll({ left: wrapperRef.current.clientWidth });
  }, [selectedItems.length]);

  const changeItem = (index: number) => (item: Item) => {
    setSelectedItems((prev) => {
      return prev.map((eItem, eIndex) => (eIndex === index ? item : eItem));
    });
  };

  const { popper, update, reference } = usePopper({
    forceUpdate: isOpen,
    gutter: 8,
    placement: 'bottom',
  });

  useEffect(() => {
    setHighlightedIndex(-1);
    update();
  }, [isOpen, update, setHighlightedIndex]);

  return (
    <>
      <Box padding="p-10" maxWidth="max-w-7xl" margin="mx-auto">
        <Box
          ref={wrapperRef}
          borderWidth="border"
          borderColor="border-gray-300"
          borderRadius="rounded-md"
          padding={['py-1', 'px-3']}
          overflow="overflow-auto"
          width="w-auto"
          display="flex"
          flexWrap="flex-no-wrap"
        >
          {selectedItems.map((selectedItem, index) => {
            return (
              <Box
                height="h-8"
                key={`selected-item-${index}`}
                onMouseEnter={() => {
                  const p = index + 1;
                  if (p % 3 === 0) {
                    setHoverIndexes([index, index - 1, index - 2]);
                  } else if (p % 3 === 2) {
                    setHoverIndexes([index - 1, index, index + 1]);
                  } else {
                    setHoverIndexes([index, index + 1, index + 2]);
                  }
                }}
                margin={
                  selectedItem.type === 'field' && index !== 0
                    ? 'ml-2'
                    : 'ml-0.5'
                }
                padding={[
                  selectedItem.type === 'value' ? 'pl-2' : 'px-2',
                  'py-0.5',
                ]}
                whitespace="whitespace-no-wrap"
                borderRadius="rounded-md"
                display="inline-flex"
                justifyContent="justify-center"
                alignItems="items-center"
                transitionProperty="transition"
                transitionDuration="duration-200"
                backgroundColor={
                  hoverIndexes.includes(index) ? 'bg-gray-300' : 'bg-gray-100'
                }
                onMouseLeave={() => {
                  setHoverIndexes([]);
                }}
              >
                <ItemRender
                  item={selectedItem}
                  shouldFocus={focusIndex === index}
                  onChange={changeItem(index)}
                  onRemove={() => {
                    setFocusIndex(index - 1);
                    openMenu();
                    setLastItem(selectedItems[selectedItems.length - 2]);
                    setSelectedItems((prev) =>
                      prev.filter(
                        (_, i) =>
                          i !== selectedItems.length - 1 &&
                          i !== selectedItems.length - 2,
                      ),
                    );
                  }}
                />
                {selectedItem.type === 'value' && (
                  <IconButton
                    icon="close"
                    size="sm"
                    padding="px-2"
                    margin="ml-0.5"
                    display="flex"
                    alignItems="items-center"
                    justifyContent="justify-center"
                    appearance="none"
                    iconSize="sm"
                    label="Remove"
                    onClick={() => {
                      const selectedIndex = selectedItems.indexOf(selectedItem);
                      const newItems = [...selectedItems];
                      setSelectedItems(
                        newItems.filter((_, index) => {
                          return (
                            index !== selectedIndex - 2 &&
                            index !== selectedIndex - 1 &&
                            index !== selectedIndex
                          );
                        }),
                      );
                    }}
                  />
                )}
              </Box>
            );
          })}
          <Box
            flex="flex-1"
            display="inline-flex"
            margin="ml-1"
            // @ts-ignore
            {...getComboboxProps({ ref: reference.ref })}
          >
            <Box
              height="h-8"
              as="input"
              outline="outline-none"
              padding="p-0"
              {...getInputProps({
                ref: inputRef,
                onFocus: () => {
                  openMenu();
                },
                onKeyDown: (e) => {
                  if (e.key === 'Backspace' && inputValue === '') {
                    if (
                      endItem?.type === 'value' &&
                      endItem?.component === 'text'
                    ) {
                    } else if (selectedItems.length > 0) {
                      setSelectedItems((prev) =>
                        prev.filter((_, i) => i !== prev.length - 1),
                      );
                    }
                    setFocusIndex(selectedItems.length - 1);
                    setTimeout(() => {
                      setFocusIndex(-1);
                    }, 500);
                  }

                  if (
                    e.key === 'Enter' &&
                    endItem?.type === 'operator' &&
                    inputValue !== ''
                  ) {
                    openMenu();
                    // @ts-ignore
                    addSelectedItem({
                      type: 'value',
                      value: inputValue,
                      component: 'text',
                    });
                    setInputValue('');
                  }
                },
              })}
            />
            {isOpen && filteredSuggestions.length > 0 && (
              <Portal>
                <Box
                  style={{ ...popper.style }}
                  ref={popper.ref}
                  backgroundColor="bg-white"
                  borderRadius="rounded-lg"
                  padding="p-2"
                  zIndex="z-50"
                  borderWidth="border"
                  borderColor="border-gray-200"
                  boxShadow="shadow-menu"
                  as="ul"
                  {...getMenuProps()}
                >
                  {filteredSuggestions.map((item, index) => (
                    <Box
                      as="li"
                      padding={['px-3', 'py-1']}
                      borderRadius="rounded-md"
                      backgroundColor={
                        highlightedIndex === index ? 'bg-blue-500' : 'bg-white'
                      }
                      textColor={
                        highlightedIndex === index
                          ? 'text-white'
                          : 'text-gray-500'
                      }
                      key={`${item.value}${index}`}
                      {...getItemProps({
                        item,
                        index,
                      })}
                    >
                      {item.text}
                    </Box>
                  ))}
                </Box>
              </Portal>
            )}
          </Box>
        </Box>
      </Box>

      <Box padding="p-10" maxWidth="max-w-7xl" margin="mx-auto">
        <Code
          theme="dark"
          language="bash"
          value={selectedItems
            .map((item, index) => {
              if (item.type === 'field') {
                return index === 0 ? item.value : `AND ${item.value}`;
              }
              if (item.type === 'value') {
                return `'${item.value}'`;
              }

              return item.value;
            })
            .join(' ')}
          showCopyButton={false}
          flex="flex-1"
        />
      </Box>
    </>
  );
}

render(<DropdownMultipleCombobox />, document.getElementById('root'));
