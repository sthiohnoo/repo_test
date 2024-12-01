import {
  Button,
  HStack,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  VStack,
} from '@chakra-ui/react';
import { FieldArray, Form, Formik } from 'formik';
import { InputControl, SubmitButton } from 'formik-chakra-ui';
import { array, object, string } from 'yup';
import { FaMinus, FaPlus } from 'react-icons/fa';
import { PostItemsRequestInner } from '../../adapter/api/__generated';

export const CreateItemModal = ({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (items: PostItemsRequestInner[]) => void;
}) => {
  const CreateItemSchema = object({
    items: array(
      object({
        name: string()
          .min(1, 'Name has to be longer than 1 character')
          .required('Name is required'),
        description: string(), // Optional but still validated as a string
      }),
    ).min(1, 'You must create at least one item'),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader textAlign="center" fontSize="2xl" fontWeight="bold">
          Create Item(s)
        </ModalHeader>
        <ModalCloseButton />
        <Formik
          initialValues={{ items: [{ name: '', description: '' }] }}
          validationSchema={CreateItemSchema}
          onSubmit={(values, formikHelpers) => {
            const transformedItems: PostItemsRequestInner[] = values.items.map((item) => ({
              name: item.name,
              description: item.description || undefined, // Handle optional fields correctly
            }));
            formikHelpers.setSubmitting(false);
            onSubmit(transformedItems);
            onClose();
          }}
        >
          {({ values }) => (
            <Form>
              <ModalBody>
                <FieldArray name="items">
                  {({ push, remove }) => (
                    <VStack spacing={3} w="full">
                      {values.items.map((_, index) => (
                        <HStack key={index} spacing={3} w="full" alignItems="flex-end">
                          <InputControl name={`items[${index}].name`} label={'Name'} />
                          <InputControl
                            name={`items[${index}].description`}
                            label={'Description'}
                          />
                          <IconButton
                            aria-label={'Remove Item'}
                            icon={<FaMinus />}
                            onClick={() => remove(index)}
                          />
                        </HStack>
                      ))}
                      <IconButton
                        aria-label={'Create one more Item'}
                        icon={<FaPlus />}
                        onClick={() => push({ id: '', name: '', description: '' })}
                      />
                    </VStack>
                  )}
                </FieldArray>
              </ModalBody>
              <ModalFooter>
                <SubmitButton colorScheme="blue">Create Item(s)</SubmitButton>
                <Button onClick={onClose}>Cancel</Button>
              </ModalFooter>
            </Form>
          )}
        </Formik>
      </ModalContent>
    </Modal>
  );
};
