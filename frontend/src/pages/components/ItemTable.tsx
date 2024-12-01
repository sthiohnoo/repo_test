import { IconButton, Table, TableContainer, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import { DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { Item } from '../../adapter/api/__generated';

export const ItemTable = ({
  data,
  onClickDeleteItem,
  onClickUpdateItem,
}: {
  data: Item[];
  onClickDeleteItem: (item: Item) => void;
  onClickUpdateItem: (item: Item) => void;
}) => {
  return (
    <TableContainer>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Description</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {data.map((entry) => {
            return (
              <Tr key={entry.id}>
                <Td>{entry.name}</Td>
                <Td>{entry.description}</Td>
                <Td>
                  <IconButton
                    aria-label={'Update Item'}
                    icon={<EditIcon />}
                    onClick={() => onClickUpdateItem(entry)}
                  />{' '}
                  <IconButton
                    aria-label={'Delete Item'}
                    icon={<DeleteIcon />}
                    onClick={() => onClickDeleteItem(entry)}
                  />{' '}
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </TableContainer>
  );
};
