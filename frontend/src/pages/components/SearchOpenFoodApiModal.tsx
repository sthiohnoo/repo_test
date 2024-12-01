// Freestyle Task #2
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
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import { Form, Formik } from 'formik';
import { InputControl, SubmitButton } from 'formik-chakra-ui';
import { object, string } from 'yup';
import { useFetchApi } from '../../hooks/useFetchApi.ts';

export type SearchFormValues = {
  categoryTag: string;
  nutritionGrade: string;
};

interface Product {
  product_name: string;
  categories_tags_en?: string[];
  nutrition_grades: string;
}

export const SearchOpenFoodApiModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const {
    setInputValueName,
    setInputValueScore,
    apiData,
    setApiData,
    setTrigger,
    loading,
    setLoading,
  } = useFetchApi();

  const SearchSchema = object({
    categoryTag: string().required('Category Tag is required'),
    nutritionGrade: string().required('Nutrition grade is required'),
  });

  const handleClose = () => {
    setApiData([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size={'3xl'}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader textAlign="center" fontSize="2xl" fontWeight="bold">
          Search Open Food API
        </ModalHeader>
        <ModalCloseButton />
        <Formik<SearchFormValues>
          initialValues={{ categoryTag: '', nutritionGrade: '' }}
          validationSchema={SearchSchema}
          onSubmit={(values, formikHelpers) => {
            formikHelpers.setSubmitting(false);
            setLoading(true);
            setInputValueName(values.categoryTag);
            setInputValueScore(values.nutritionGrade);
            setTrigger(true);
          }}
        >
          {() => (
            <Form>
              <ModalBody>
                <HStack spacing={3} w="full">
                  <InputControl
                    name={'categoryTag'}
                    label={'Category Tag'}
                    inputProps={{ placeholder: 'e.g. Orange Juice' }}
                  />
                  <InputControl
                    name={'nutritionGrade'}
                    label={'Nutrition Grade'}
                    inputProps={{ placeholder: 'Enter nutrition grade (e.g., a, b, c, d, e)' }}
                  />
                </HStack>
              </ModalBody>
              <ModalFooter>
                <SubmitButton colorScheme="blue" isLoading={loading}>
                  Search
                </SubmitButton>
                <Button onClick={handleClose}>Cancel</Button>
              </ModalFooter>
            </Form>
          )}
        </Formik>
        {apiData && (
          <Table>
            <Thead>
              <Tr>
                <Th>Product Name</Th>
                <Th>Category Tags</Th>
                <Th>Nutrition Grades</Th>
              </Tr>
            </Thead>
            <Tbody>
              {apiData.length > 0 ? (
                apiData.map((product: Product, index: number) => (
                  <Tr key={index}>
                    <Td>{product.product_name || 'N/A'}</Td>
                    <Td>{product.categories_tags_en?.join(', ') || 'N/A'}</Td>
                    <Td>{product.nutrition_grades || 'N/A'}</Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={3} textAlign="center">
                    No products found.
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        )}
      </ModalContent>
    </Modal>
  );
};
