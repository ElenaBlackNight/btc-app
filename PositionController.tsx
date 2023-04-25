import React, { useCallback, useState } from 'react';
import { Circle, Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';
import ClosePosition from '@/pages/Trade/components/OrdersPanel/components/PositionController/components/ClosePosition';
import Orders from '@/pages/Trade/components/OrdersPanel/components/PositionController/components/Orders/Orders';
import Info from '@/pages/Trade/components/OrdersPanel/components/PositionController/components/Info/Info';
import { observer } from 'mobx-react';
import { useQuery } from '@apollo/client';
import { Order } from '@/@types/common';
import { OrdersQuery } from '@/graphql/Orders.graphql';
import { useAccountStore } from '@/stores/AccountStore';
import { useExchange } from '@/pages/Trade/hooks/useExchange';

type TPosControllerContext = {
  handleTabsChange: (index: number) => void;
};

interface TOrdersList {
  ordersList: Order[];
  loadingOrderList: boolean;
}

export enum EPosControllerTabs {
  'Info',
  'Orders',
  'Close Position',
}

const TabsList = [
  { name: 'Information', comp: <Info /> },
  { name: 'Orders', comp: <Orders /> },
  { name: 'Close Position', comp: <ClosePosition /> },
] as const;

const TabsContext = React.createContext<TPosControllerContext>(null);
export const OrdersListContext = React.createContext<TOrdersList>(null);

const PositionController = observer(() => {
  const { handleTabsChange, tabIndex, ordersList, loadingOrderList } = usePositionController();

  return (
    <OrdersListContext.Provider value={{ ordersList, loadingOrderList }}>
      <TabsContext.Provider value={{ handleTabsChange }}>
        <Tabs color="basic.700" variant="soft-rounded" index={tabIndex} onChange={handleTabsChange}>
          <TabList gap={'4px'}>
            {TabsList.map(({ name }) => (
              <Tab
                key={name}
                fontSize={'12px'}
                lineHeight={'18px'}
                border={'none'}
                fontWeight={'500'}
                outline={'none!important'}
                boxShadow={'none!important'}
                borderRadius={'8px'}
                p={'3px 12px'}
                _selected={{
                  color: 'basic.800',
                  fontWeight: '700',
                  bgColor: 'basic.500',
                }}
              >
                {name}
                {name == 'Orders' && ordersList.length !== 0 && (
                  <Circle size={'16px'} borderRadius={'50%'} bgColor="primary.600" ml="4px">
                    {ordersList.length}
                  </Circle>
                )}
              </Tab>
            ))}
          </TabList>
          <TabPanels pt={'16px'}>
            {TabsList.map(({ comp, name }) => (
              <TabPanel p={0} key={name}>
                {comp}
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      </TabsContext.Provider>
    </OrdersListContext.Provider>
  );
});

const usePositionController = () => {
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabsChange = useCallback((index: number) => {
    setTabIndex(index);
  }, []);

  const account = useAccountStore();
  const { config, currentPositionTab } = useExchange();

  const { data, loading } = useQuery<{ activeOrders: Order[] }>(OrdersQuery, {
    variables: {
      trader: account.address,
      market: config.address,
      direction: currentPositionTab,
    },
    pollInterval: 4000,
    initialFetchPolicy: 'network-only',
    fetchPolicy: 'no-cache',
    skip: !account.address || currentPositionTab === 'history',
  });

  const ordersList = data?.activeOrders || [];

  return {
    tabIndex,
    handleTabsChange,
    ordersList,
    loadingOrderList: loading,
  };
};

export function usePositionControllerContext() {
  return React.useContext(TabsContext);
}

export function useOrdersListContext() {
  return React.useContext(OrdersListContext);
}

export default PositionController;
