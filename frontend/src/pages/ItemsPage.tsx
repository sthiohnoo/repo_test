import { BaseLayout } from '../layout/BaseLayout.tsx';
import { Box, Button, HStack, Input, useDisclosure, useToast } from '@chakra-ui/react';
import React, { useCallback, useEffect, useState } from 'react';
import { ItemTable } from './components/ItemTable.tsx';
import { useApiClient } from '../hooks/useApiClient.ts';
import { Item, PostItemsRequestInner, PutItemsIdRequest } from '../adapter/api/__generated';
import { UpdateItemModal } from './components/updateItemModal.tsx';
import { CreateItemModal } from './components/CreateItemModal.tsx';
import axios from 'axios';

export const ItemsPage = () => {
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isUpdateOpen, onOpen: onUpdateOpen, onClose: onUpdateClose } = useDisclosure();

  const client = useApiClient();
  const toast = useToast();

  const [items, setItems] = useState<Item[]>([]);
  const [itemsToBeUpdated, setItemToBeUpdated] = useState<Item | null>(null);

  const loadItems = useCallback(async () => {
    const res = await client.getItems();
    setItems(res.data);
  }, [client]);

  useEffect(() => {
    loadItems().catch((error) => {
      console.error('Failed to load items:', error);
    });
  }, [loadItems]);

  const onClickOpenCreateItemModal = async () => {
    onCreateOpen();
  };
  const onSubmitCreateItem = async (item: PostItemsRequestInner[]) => {
    try {
      await client.postItems(item);
      await loadItems();
      onCreateClose();
    } catch (_error) {
      toast({
        description: 'Creation canceled! Item already exists',
        status: 'error',
        duration: 4000,
        isClosable: true,
        position: 'top',
      });
    }
  };

  const onClickOpenUpdateItemModal = async (item: Item) => {
    setItemToBeUpdated(item);
    onUpdateOpen();
  };
  const onSubmitUpdateItem = async (item: PutItemsIdRequest) => {
    try {
      await client.putItemsId(itemsToBeUpdated?.id ?? '', item);
      await loadItems();
      onUpdateClose();
      setItemToBeUpdated(null);
    } catch (_error) {
      toast({
        description: 'Update canceled! ItemName already exists',
        status: 'error',
        duration: 4000,
        isClosable: true,
        position: 'top',
      });
    }
  };

  const onClickDeleteItem = async (item: Item) => {
    try {
      await client.deleteItemsId(item.id);
      await loadItems();
    } catch (_error) {
      toast({
        description: 'Deletion canceled. Item exists in a ShoppingList',
        status: 'error',
        duration: 4000,
        isClosable: true,
        position: 'top',
      });
    }
  };

  const handleSearchItemChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value;

    if (searchValue === '') {
      await loadItems();
      return;
    }

    try {
      const res = await client.getItemsNameItemName(searchValue);
      setItems([res.data]);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          setItems([]);
        }
      } else {
        console.error('Unexpected error:', error);
      }
    }
  };

  return (
    <BaseLayout>
      <Box>
        <HStack spacing={3} mb={4}>
          <Button
            variant={'solid'}
            colorScheme={'blue'}
            onClick={() => onClickOpenCreateItemModal()}
            flex="0 0 15%"
          >
            Create new Item(s)
          </Button>
          <Input
            placeholder="Search Item by name"
            onChange={handleSearchItemChange}
            flex="0 0 25%"
            border="1px"
            borderColor="blue"
            borderRadius="md"
          />
        </HStack>
        <CreateItemModal
          isOpen={isCreateOpen}
          onClose={onCreateClose}
          onSubmit={onSubmitCreateItem}
        />{' '}
        <UpdateItemModal
          isOpen={isUpdateOpen}
          onClose={onUpdateClose}
          onSubmit={onSubmitUpdateItem}
          itemName={itemsToBeUpdated?.name || ''}
          itemDescription={itemsToBeUpdated?.description || ''}
        />{' '}
        <ItemTable
          data={items}
          onClickDeleteItem={onClickDeleteItem}
          onClickUpdateItem={onClickOpenUpdateItemModal}
        />
      </Box>
    </BaseLayout>
  );
};
