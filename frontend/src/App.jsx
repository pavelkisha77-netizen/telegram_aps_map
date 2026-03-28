import { useEffect, useState } from 'react';
import { Layout, Button, Modal } from 'antd';
import 'antd/dist/reset.css';
import MapView from './components/Map/MapView';
import AddPointForm from './components/Sidebar/AddPointForm';
import { fetchPoints } from './api/api';
import { useMapStore } from './store/store';
import PointDetailsPanel from './components/PointDetails/PointDetailsPanel';
import './App.css';

const { Content } = Layout;

export default function App() {
  const setPoints = useMapStore((state) => state.setPoints);
  const draftPoint = useMapStore((state) => state.draftPoint);
  const [modalOpen, setModalOpen] = useState(false);


  useEffect(() => {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
  }
}, []);
 
  
  useEffect(() => {
    async function loadPoints() {
      try {
        const data = await fetchPoints();
        setPoints(data);
      } catch (error) {
        console.error('Ошибка загрузки точек:', error);
      }
    }
    loadPoints();
  }, [setPoints]);

  useEffect(() => {
    if (draftPoint) setModalOpen(true);
  }, [draftPoint]);

  const handleCloseModal = () => {
    setModalOpen(false);
    if (draftPoint) useMapStore.getState().clearDraftPoint();
  };

  return (
    <Layout className="app-layout">
      <Content className="app-layout__content">
        <MapView />
      </Content>

      <PointDetailsPanel />

      <Modal title="Добавить точку" open={modalOpen} onCancel={handleCloseModal} footer={null}>
        <AddPointForm onSubmitClose={handleCloseModal} />
      </Modal>
    </Layout>
  );
}
