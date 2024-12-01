import { AsyncCreatableProps, AsyncCreatableSelect } from 'chakra-react-select';
import { useField } from 'formik';
import { BaseProps, FormControl } from 'formik-chakra-ui';
import { GroupBase } from 'react-select';

export type SelectControlProps<
  Option,
  IsMulti extends boolean,
  Group extends GroupBase<Option>,
> = BaseProps & {
  selectProps?: AsyncCreatableProps<Option, IsMulti, Group>;
};

export const ReactSelectControl = <
  Option,
  IsMulti extends boolean,
  Group extends GroupBase<Option>,
>(
  props: SelectControlProps<Option, IsMulti, Group>,
) => {
  const { name, label, selectProps, ...rest } = props;
  const [field, _meta, helper] = useField(name);

  return (
    <FormControl name={name} label={label} {...rest}>
      <AsyncCreatableSelect
        {...field}
        id={name}
        {...selectProps}
        onChange={(e) => {
          helper.setValue(e);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
          }
        }}
      />
    </FormControl>
  );
};

export default ReactSelectControl;
