import { useEffect, useMemo, useState } from 'react';
import { Modal, Form, Input, Button, Upload, message, Popconfirm, Empty } from 'antd';
import {
  UploadOutlined,
  DeleteOutlined,
  SaveOutlined,
  LeftOutlined,
  RightOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { useMapStore } from '../../store/store';
import { deletePoint, updatePoint, uploadMedia, deleteMedia } from '../../api/api';
import './PointDetailsPanel.css';

export default function PointDetailsPanel() {
  const selectedPoint = useMapStore((state) => state.selectedPoint);
  const clearSelectedPoint = useMapStore((state) => state.clearSelectedPoint);
  const updatePointInStore = useMapStore((state) => state.updatePointInStore);
  const deletePointFromStore = useMapStore((state) => state.deletePointFromStore);

  const [form] = Form.useForm();
  const [newFiles, setNewFiles] = useState([]);
  const [existingMedia, setExistingMedia] = useState([]);
  const [removedMedia, setRemovedMedia] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewItems, setPreviewItems] = useState([]);
  const [previewIndex, setPreviewIndex] = useState(0);

  useEffect(() => {
    if (selectedPoint) {
      form.setFieldsValue({
        title: selectedPoint.title || '',
        description: selectedPoint.description || ''
      });
      setExistingMedia(selectedPoint.media || []);
      setRemovedMedia([]);
      setNewFiles([]);
    } else {
      form.resetFields();
      setExistingMedia([]);
      setRemovedMedia([]);
      setNewFiles([]);
    }
  }, [selectedPoint, form]);

  const isOpen = !!selectedPoint;

  const mediaCountText = useMemo(() => {
    const oldCount = existingMedia.length;
    const newCount = newFiles.length;
    const removedCount = removedMedia.length;
    return `${oldCount} текущих, ${newCount} новых, ${removedCount} на удаление`;
  }, [existingMedia, newFiles, removedMedia]);

  const safeCreateObjectURL = (file) => {
    if (!file) return '';
    if (file.url) return file.url;
    if (file.originFileObj instanceof Blob) return URL.createObjectURL(file.originFileObj);
    return '';
  };

  const openPreview = (items, index) => {
    setPreviewItems(items);
    setPreviewIndex(index);
    setPreviewVisible(true);
  };

  const prevPreview = () => {
    setPreviewIndex((prev) => (prev - 1 + previewItems.length) % previewItems.length);
  };

  const nextPreview = () => {
    setPreviewIndex((prev) => (prev + 1) % previewItems.length);
  };

  const currentPreviewItem = previewItems[previewIndex];
  const currentPreviewUrl = safeCreateObjectURL(currentPreviewItem);

  const handleRemoveExistingMedia = (indexToRemove) => {
    const mediaItem = existingMedia[indexToRemove];
    if (!mediaItem) return;

    setRemovedMedia((prev) => [...prev, mediaItem]);
    setExistingMedia((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSave = async (values) => {
    if (!selectedPoint) return;

    try {
      setIsSaving(true);

      let uploadedMedia = [];

      if (newFiles.length > 0) {
        const formData = new FormData();

        newFiles.forEach((file) => {
          if (file.originFileObj) {
            formData.append('files', file.originFileObj);
          }
        });

        const uploadResult = await uploadMedia(formData);
        uploadedMedia = uploadResult.files || [];
      }

      if (removedMedia.length > 0) {
        await Promise.all(
          removedMedia.map((item) => {
            if (!item.public_id) return Promise.resolve();

            return deleteMedia(item.public_id, item.type === 'video' ? 'video' : 'image');
          })
        );
      }

      const updatedPayload = {
        title: values.title || 'Без названия',
        description: values.description,
        location: selectedPoint.location,
        media: [...existingMedia, ...uploadedMedia]
      };

      const updatedPoint = await updatePoint(selectedPoint._id, updatedPayload);

      updatePointInStore(updatedPoint);
      setRemovedMedia([]);
      setNewFiles([]);
      message.success('Точка обновлена');
      clearSelectedPoint();
    } catch (error) {
      console.error(error);
      message.error('Не удалось обновить точку');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePoint = async () => {
    if (!selectedPoint) return;

    try {
      setIsSaving(true);

      const mediaToDelete = selectedPoint.media || [];

      if (mediaToDelete.length > 0) {
        await Promise.all(
          mediaToDelete.map((item) => {
            if (!item.public_id) return Promise.resolve();

            return deleteMedia(item.public_id, item.type === 'video' ? 'video' : 'image');
          })
        );
      }

      await deletePoint(selectedPoint._id);
      deletePointFromStore(selectedPoint._id);
      clearSelectedPoint();
      message.success('Точка удалена');
    } catch (error) {
      console.error(error);
      message.error('Не удалось удалить точку');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Modal
        title="Редактировать точку"
        open={isOpen}
        onCancel={clearSelectedPoint}
        footer={null}
        destroyOnClose
        width={720}
      >
        {!selectedPoint ? (
          <Empty description="Точка не выбрана" />
        ) : (
          <div className="point-details">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
              className="point-details__form"
            >
              <Form.Item
                label="Описание"
                name="description"
                rules={[{ required: true, message: 'Описание обязательно' }]}
              >
                <Input.TextArea rows={4} placeholder="Описание точки" />
              </Form.Item>

              <div className="point-details__section">
                <div className="point-details__section-title">Медиа</div>
                <div className="point-details__media-note">{mediaCountText}</div>

                {existingMedia.length > 0 ? (
                  <div className="point-details__media-grid">
                    {existingMedia.map((item, index) => (
                      <div key={`${item.url}-${index}`} className="point-details__media-card">
                        {item.type === 'image' ? (
                          <img
                            src={item.url}
                            alt="media"
                            className="point-details__media-image"
                            onClick={() => openPreview(existingMedia, index)}
                          />
                        ) : (
                          <video
                            src={item.url}
                            controls
                            className="point-details__media-video"
                            onClick={() => openPreview(existingMedia, index)}
                          />
                        )}

                        <Button
                          danger
                          size="small"
                          className="point-details__media-delete"
                          onClick={() => handleRemoveExistingMedia(index)}
                        >
                          Удалить
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="point-details__empty-media">Медиа пока нет</div>
                )}
              </div>

              <Form.Item label="Добавить фото/видео">
                <Upload
                  fileList={newFiles}
                  beforeUpload={() => false}
                  multiple
                  onChange={({ fileList }) => setNewFiles(fileList)}
                >
                  <Button icon={<UploadOutlined />}>Выбрать файлы</Button>
                </Upload>
              </Form.Item>

              <div className="point-details__actions">
                <Button type="primary" htmlType="submit" loading={isSaving} icon={<SaveOutlined />}>
                  Сохранить изменения
                </Button>

                <Popconfirm
                  title="Удалить точку?"
                  description="Это действие нельзя отменить"
                  okText="Удалить"
                  cancelText="Отмена"
                  onConfirm={handleDeletePoint}
                >
                  <Button danger loading={isSaving} icon={<DeleteOutlined />}>
                    Удалить точку
                  </Button>
                </Popconfirm>
              </div>
            </Form>
          </div>
        )}
      </Modal>

      <Modal
        open={previewVisible}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width="80%"
        centered
      >
        {currentPreviewItem && currentPreviewUrl && (
          <div className="modal-preview-wrapper">
            {previewItems.length > 1 && (
              <Button className="prev-btn" icon={<LeftOutlined />} onClick={prevPreview} />
            )}

            {currentPreviewItem.type?.startsWith('image') ? (
              <img src={currentPreviewUrl} className="modal-preview-media" />
            ) : (
              <video src={currentPreviewUrl} controls className="modal-preview-media" />
            )}

            {previewItems.length > 1 && (
              <Button className="next-btn" icon={<RightOutlined />} onClick={nextPreview} />
            )}

            <a href={currentPreviewUrl} download className="download-btn">
              <Button icon={<DownloadOutlined />}>Скачать</Button>
            </a>
          </div>
        )}
      </Modal>
    </>
  );
}
