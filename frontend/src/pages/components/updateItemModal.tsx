import {
  Button,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react';
import { Form, Formik } from 'formik';
import { InputControl, SubmitButton } from 'formik-chakra-ui';
import { object, string } from 'yup';

export type UpdateItemFormValues = {
  name: string;
  description: string;
};

export const UpdateItemModal = ({
  isOpen,
  onClose,
  onSubmit,
  itemName,
  itemDescription,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: UpdateItemFormValues) => void;
  itemName: string;
  itemDescription: string;
}) => {
  const UpdateItemSchema = object({
    name: string().min(1, 'Name has to be longer than 1 character').required('Name is required'),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader textAlign="center" fontSize="2xl" fontWeight="bold">
          Update Item
        </ModalHeader>
        <ModalCloseButton />
        <Formik<UpdateItemFormValues>
          initialValues={{ name: itemName, description: itemDescription }}
          validationSchema={UpdateItemSchema}
          onSubmit={(values, formikHelpers) => {
            formikHelpers.setSubmitting(false);
            onSubmit(values);
            onClose();
          }}
        >
          {() => (
            <Form>
              <ModalBody>
                <HStack spacing={3} w="full">
                  <InputControl
                    name={'name'}
                    label={'Name'}
                    inputProps={{ placeholder: itemName }}
                  />
                  <InputControl
                    name={'description'}
                    label={'Description'}
                    inputProps={{ placeholder: itemDescription }}
                  />
                </HStack>
              </ModalBody>
              <ModalFooter>
                <SubmitButton colorScheme="blue">Update Item</SubmitButton>
                <Button onClick={onClose}>Cancel</Button>
              </ModalFooter>
            </Form>
          )}
        </Formik>
      </ModalContent>
    </Modal>
  );
};
