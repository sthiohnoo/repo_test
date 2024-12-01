import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react';
import { number, object } from 'yup';
import { Form, Formik } from 'formik';
import { InputControl, SubmitButton } from 'formik-chakra-ui';

export const UpdateQuantityModal = ({
  isOpen,
  onClose,
  initialQuantity,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialQuantity: number;
  onSubmit: (quantity: number) => void;
}) => {
  const UpdateQuantitySchema = object({
    quantity: number().min(1, 'Smaller then 1 not allowed').required('Field is required'),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={'xs'}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Change Quantity</ModalHeader>
        <ModalCloseButton />
        <Formik
          initialValues={{ quantity: initialQuantity }}
          validationSchema={UpdateQuantitySchema}
          onSubmit={(values, formikHelpers) => {
            formikHelpers.setSubmitting(false);
            onSubmit(values.quantity);
            onClose();
          }}
          enableReinitialize={true}
        >
          <Form>
            <ModalBody>
              <InputControl
                name={'quantity'}
                inputProps={{ type: 'number', placeholder: 'Quantity?' }}
              />
            </ModalBody>
            <ModalFooter>
              <SubmitButton colorScheme="blue" mr={3}>
                Change
              </SubmitButton>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
            </ModalFooter>
          </Form>
        </Formik>
      </ModalContent>
    </Modal>
  );
};
