import {
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react';
import React, { useCallback, useEffect, useState } from 'react';

import { useApiClient } from '../../hooks/useApiClient.ts';
import { Item } from '../../adapter/api/__generated';
import { InputControl, SelectControl, SubmitButton } from 'formik-chakra-ui';
import { ErrorMessage, ErrorMessageProps, Form, Formik, FormikHelpers } from 'formik';
import { number, object, string } from 'yup';
import axios from 'axios';

export type AddItemFormValues = {
  id: string;
  quantity: number;
  isPurchased: boolean;
};

export const AddItemTableModal = ({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: AddItemFormValues) => Promise<void>;
}) => {
  const tableRowBg = useColorModeValue('white', 'gray.700');
  const selectedRowBg = useColorModeValue('blue.100', 'blue.600');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const client = useApiClient();
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [itemsFound, setItemsFound] = useState<boolean>(true);

  const loadItems = useCallback(async () => {
    const res = await client.getItems();
    setItems(res.data);
  }, [client]);

  useEffect(() => {
    loadItems().catch((error) => {
      console.error('Failed to load items:', error);
    });
  }, [loadItems]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedItem(null);
      loadItems().catch((error) => {
        console.error('Failed to load items:', error);
      });
    }
  }, [isOpen, loadItems]);

  const selectItem = (
    itemId: string,
    setFieldValue: FormikHelpers<AddItemFormValues>['setFieldValue'],
  ) => {
    setSelectedItem((prevSelectedItem) => {
      const newSelectedItem = prevSelectedItem === itemId ? null : itemId;
      setFieldValue('id', newSelectedItem ?? '').catch((error) => {
        console.error('Failed to select item:', error);
      });
      return newSelectedItem;
    });
  };

  const AddItemSchema = object({
    id: string().required('You must select an item'),
    quantity: number().min(1, 'Smaller then 1 not allowed').required('Field is required'),
  });

  const CustomErrorMessage = (props: ErrorMessageProps) => (
    <div style={{ color: 'red' }}>
      <ErrorMessage {...props} />
    </div>
  );

  const handleSearchItemChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setFieldValue: FormikHelpers<AddItemFormValues>['setFieldValue'],
  ) => {
    const searchValue = e.target.value;

    if (searchValue === '') {
      await loadItems();
      setItemsFound(true);
      setSelectedItem(null);
      await setFieldValue('id', '');
      return;
    }

    try {
      const res = await client.getItemsNameItemName(searchValue);
      setItems([res.data]);
      setItemsFound(true);
      console.log(res.data);
      if (res.data) {
        setSelectedItem(res.data.id);
        await setFieldValue('id', res.data.id);
      } else {
        setSelectedItem(null);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          setItems([]);
          setItemsFound(false);
          setSelectedItem(null);
        }
      } else {
        console.error('Unexpected error:', error);
      }
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />

        <Formik<AddItemFormValues>
          initialValues={{ id: '', quantity: 1, isPurchased: false }}
          validationSchema={AddItemSchema}
          onSubmit={async (values, formikHelpers) => {
            formikHelpers.setSubmitting(false);
            await onSubmit(values);
            onClose();
          }}
        >
          {({ setFieldValue, touched }) => (
            <ModalContent as={Form}>
              <ModalHeader textAlign={'center'}>Items</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <Input
                  placeholder="Search Item by name"
                  onChange={(e) => handleSearchItemChange(e, setFieldValue)}
                  flex="0 0 25%"
                  border="1px"
                  borderColor="blue"
                  borderRadius="md"
                />
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th borderBottom="1px" borderColor={borderColor}>
                        Name
                      </Th>
                      <Th borderBottom="1px" borderColor={borderColor}>
                        Description
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {items.map((item) => (
                      <Tr
                        key={item.id}
                        onClick={() => selectItem(item.id, setFieldValue)}
                        bg={selectedItem === item.id ? selectedRowBg : tableRowBg}
                        cursor="pointer"
                      >
                        <Td borderBottom="1px" borderColor={borderColor}>
                          {item.name}
                        </Td>
                        <Td borderBottom="1px" borderColor={borderColor}>
                          {item.description}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </ModalBody>
              {itemsFound && (
                <ModalFooter>
                  <VStack spacing={3} w="full">
                    <HStack spacing={3} w="full">
                      <InputControl
                        name={'quantity'}
                        label={'Quantity'}
                        inputProps={{ placeholder: 'How many Items?' }}
                      />
                      <SelectControl name={'isPurchased'} label={'Is Purchased?'}>
                        <option value="false">false</option>
                        <option value="true">true</option>
                      </SelectControl>
                    </HStack>
                    <SubmitButton colorScheme="blue">Add Item to ShoppingList</SubmitButton>
                    {touched.id && <CustomErrorMessage name="id" />}
                  </VStack>
                </ModalFooter>
              )}
            </ModalContent>
          )}
        </Formik>
      </Modal>
    </>
  );
};
