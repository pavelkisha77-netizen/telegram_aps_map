import { useEffect, useState } from 'react';
import { Layout, Spin, Modal, FloatButton } from 'antd';
import 'antd/dist/reset.css';
import MapView from './components/Map/MapView';
import AddPointForm from './components/Sidebar/AddPointForm';
import AddPointModalForm from './components/Map/AddPointModal';
import { fetchPoints } from './api/api';
import { useMapStore } from './store/store';
import PointDetailsPanel from './components/PointDetails/PointDetailsPanel';
import './App.css';
import CitySelect from './components/CitySelect/CitySelect';
import { PlusOutlined } from '@ant-design/icons';
import { socket } from './socket/socket';

const { Content } = Layout;

export default function App() {
  const setPoints = useMapStore((state) => state.setPoints);
  const addPoint = useMapStore((state) => state.addPoint);
  const updatePointInStore = useMapStore((state) => state.updatePointInStore);
  const deletePointFromStore = useMapStore((state) => state.deletePointFromStore);
  const draftPoint = useMapStore((state) => state.draftPoint);
  const clearDraftPoint = useMapStore((state) => state.clearDraftPoint);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState(null); // 'map' | 'manual'
  const [isPageLoading, setIsPageLoading] = useState(true);

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
        setIsPageLoading(true);
        const data = await fetchPoints();
        setPoints(data);
      } catch (error) {
        console.error('Ошибка загрузки точек:', error);
      } finally {
        setIsPageLoading(false);
      }
    }

    loadPoints();
  }, [setPoints]);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('point:created', (newPoint) => {
      const points = useMapStore.getState().points;
      const exists = points.some((point) => point._id === newPoint._id);

      if (!exists) {
        addPoint(newPoint);
      }
    });

    socket.on('point:updated', (updatedPoint) => {
      updatePointInStore(updatedPoint);
    });

    socket.on('point:deleted', ({ _id }) => {
      deletePointFromStore(_id);
    });

    return () => {
      socket.off('connect');
      socket.off('point:created');
      socket.off('point:updated');
      socket.off('point:deleted');
    };
  }, [addPoint, updatePointInStore, deletePointFromStore]);

  useEffect(() => {
    if (draftPoint) {
      setModalMode('map');
      setModalOpen(true);
    }
  }, [draftPoint]);

  const handleOpenManualModal = () => {
    setModalMode('manual');
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setModalMode(null);

    if (draftPoint) {
      clearDraftPoint();
    }
  };

  return (
    <Layout className="app-layout">
      <Content className="app-layout__content">
        <MapView />
        <CitySelect />

        <button onClick={handleOpenManualModal} title="Добавить точку" className="add-point-button">
          <img src="/add.jpeg" alt="Добавить точку" className="add-point-button__icon" />
        </button>
      </Content>

      <PointDetailsPanel />

      <Modal
        title="Добавить точку"
        open={modalOpen}
        onCancel={handleCloseModal}
        footer={null}
        destroyOnHidden
      >
        {modalMode === 'map' ? (
          <AddPointForm onSubmitClose={handleCloseModal} />
        ) : modalMode === 'manual' ? (
          <AddPointModalForm onSubmitClose={handleCloseModal} />
        ) : null}
      </Modal>

      {isPageLoading && (
        <div className="page-loader">
          <Spin size="large" />
          <div className="page-loader__text">Загружаем точки...</div>
        </div>
      )}
    </Layout>
  );
}
