import { useEffect, useMemo, useState } from 'react';
import { Modal, Form, Input, Button, Upload, message, Empty } from 'antd';
import {
  UploadOutlined,
  DeleteOutlined,
  SaveOutlined,
  LeftOutlined,
  RightOutlined,
  DownloadOutlined,
  CloseOutlined
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

  useEffect(() => {
    return () => {
      newFiles.forEach((file) => {
        if (file.preview && file.preview.startsWith('blob:')) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [newFiles]);

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
    if (file.preview) return file.preview;
    if (file.originFileObj instanceof Blob) return URL.createObjectURL(file.originFileObj);
    return '';
  };

  const normalizePreviewItem = (item) => {
    const url = safeCreateObjectURL(item);

    let type = item.type || '';

    if (!type && item.resource_type) {
      type = item.resource_type === 'video' ? 'video/mp4' : 'image/jpeg';
    }

    if (!type && item.url) {
      const lowerUrl = item.url.toLowerCase();
      if (
        lowerUrl.endsWith('.mp4') ||
        lowerUrl.endsWith('.webm') ||
        lowerUrl.endsWith('.mov') ||
        lowerUrl.endsWith('.avi')
      ) {
        type = 'video/mp4';
      } else {
        type = 'image/jpeg';
      }
    }

    return {
      ...item,
      previewUrl: url,
      type
    };
  };

  const getAllPreviewItems = () => {
    const existing = existingMedia.map((item) =>
      normalizePreviewItem({
        ...item,
        source: 'existing'
      })
    );

    const fresh = newFiles.map((item) =>
      normalizePreviewItem({
        ...item,
        source: 'new'
      })
    );

    return [...existing, ...fresh];
  };

  const openPreview = (items, index) => {
    setPreviewItems(items);
    setPreviewIndex(index);
    setPreviewVisible(true);
  };

  const openCombinedPreview = (source, index) => {
    const items = getAllPreviewItems();

    const existingCount = existingMedia.length;
    const targetIndex = source === 'existing' ? index : existingCount + index;

    setPreviewItems(items);
    setPreviewIndex(targetIndex);
    setPreviewVisible(true);
  };

  const prevPreview = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setPreviewIndex((prev) => (prev - 1 + previewItems.length) % previewItems.length);
  };

  const nextPreview = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setPreviewIndex((prev) => (prev + 1) % previewItems.length);
  };

  const handleDownload = (e) => {
    e?.preventDefault();
    e?.stopPropagation();

    const currentPreviewItem = previewItems[previewIndex];
    const currentPreviewUrl =
      currentPreviewItem?.previewUrl || safeCreateObjectURL(currentPreviewItem);

    if (!currentPreviewUrl) return;

    const link = document.createElement('a');
    link.href = currentPreviewUrl;
    link.download = currentPreviewItem?.name || 'media';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRemoveExistingMedia = (indexToRemove) => {
    const mediaItem = existingMedia[indexToRemove];
    if (!mediaItem) return;

    setRemovedMedia((prev) => [...prev, mediaItem]);
    setExistingMedia((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleRemoveNewFile = (indexToRemove) => {
    const fileToRemove = newFiles[indexToRemove];

    if (fileToRemove?.preview && fileToRemove.preview.startsWith('blob:')) {
      URL.revokeObjectURL(fileToRemove.preview);
    }

    setNewFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const beforeUpload = (file) => {
    const isAllowed = file.type.startsWith('image/') || file.type.startsWith('video/');

    if (!isAllowed) {
      message.error('Можно загрузить только фото или видео');
      return Upload.LIST_IGNORE;
    }

    const preview = URL.createObjectURL(file);

    setNewFiles((prev) => {
      const alreadyExists = prev.some(
        (item) =>
          item.name === file.name &&
          item.originFileObj?.size === file.size &&
          item.originFileObj?.lastModified === file.lastModified
      );

      if (alreadyExists) {
        message.warning('Этот файл уже добавлен');
        URL.revokeObjectURL(preview);
        return prev;
      }

      return [
        ...prev,
        {
          uid: file.uid,
          name: file.name,
          status: 'done',
          type: file.type,
          originFileObj: file,
          preview
        }
      ];
    });

    return false;
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

      newFiles.forEach((file) => {
        if (file.preview && file.preview.startsWith('blob:')) {
          URL.revokeObjectURL(file.preview);
        }
      });

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

  const currentPreviewItem = previewItems[previewIndex];
  const currentPreviewUrl =
    currentPreviewItem?.previewUrl || safeCreateObjectURL(currentPreviewItem);

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
                {/* <div className="point-details__media-note">{mediaCountText}</div> */}

                {existingMedia.length > 0 ? (
                  <div className="point-details__media-grid">
                    {existingMedia.map((item, index) => {
                      const normalized = normalizePreviewItem(item);
                      const isImage = normalized.type?.startsWith('image');
                      const mediaUrl = normalized.previewUrl;

                      return (
                        <div key={`${item.url}-${index}`} className="point-details__media-card">
                          {isImage ? (
                            <img
                              src={mediaUrl}
                              alt="media"
                              className="point-details__media-image"
                              onClick={() => openCombinedPreview('existing', index)}
                            />
                          ) : (
                            <video
                              src={mediaUrl}
                              controls
                              className="point-details__media-video"
                              onClick={() => openCombinedPreview('existing', index)}
                            />
                          )}

                          <Button
                            danger
                            size="small"
                            className="point-details__media-delete"
                            onClick={() => handleRemoveExistingMedia(index)}
                            htmlType="button"
                          >
                            Удалить
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="point-details__empty-media">Медиа пока нет</div>
                )}
              </div>

              <Form.Item label="Добавить фото/видео">
                <Upload
                  beforeUpload={beforeUpload}
                  fileList={newFiles}
                  showUploadList={false}
                  multiple
                  accept="image/*,video/*"
                >
                  <Button icon={<UploadOutlined />} htmlType="button">
                    Выбрать файлы
                  </Button>
                </Upload>
              </Form.Item>

              {newFiles.length > 0 && (
                <div className="point-details__section">
                  <div className="point-details__section-title">Новые файлы</div>

                  <div className="point-details__media-grid">
                    {newFiles.map((file, index) => {
                      const mediaUrl = safeCreateObjectURL(file);
                      const isImage = file.type?.startsWith('image/');

                      if (!mediaUrl) return null;

                      return (
                        <div key={file.uid || index} className="point-details__media-card">
                          {isImage ? (
                            <img
                              src={mediaUrl}
                              alt={file.name || 'preview'}
                              className="point-details__media-image"
                              onClick={() => openCombinedPreview('new', index)}
                            />
                          ) : (
                            <video
                              src={mediaUrl}
                              controls
                              className="point-details__media-video"
                              onClick={() => openCombinedPreview('new', index)}
                            />
                          )}

                          <Button
                            danger
                            size="small"
                            className="point-details__media-delete"
                            icon={<CloseOutlined />}
                            onClick={() => handleRemoveNewFile(index)}
                            htmlType="button"
                          >
                            Удалить
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="point-details__actions">
                <Button type="primary" htmlType="submit" loading={isSaving} icon={<SaveOutlined />}>
                  Сохранить изменения
                </Button>

                {/* Раскомментируй если снова нужен delete */}
                {/*
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
                */}
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
              <Button
                className="prev-btn"
                icon={<LeftOutlined />}
                onClick={prevPreview}
                htmlType="button"
              />
            )}

            {currentPreviewItem.type?.startsWith('image') ? (
              <img src={currentPreviewUrl} alt="preview" className="modal-preview-media" />
            ) : (
              <video src={currentPreviewUrl} controls className="modal-preview-media" />
            )}

            {previewItems.length > 1 && (
              <Button
                className="next-btn"
                icon={<RightOutlined />}
                onClick={nextPreview}
                htmlType="button"
              />
            )}

            <Button
              icon={<DownloadOutlined />}
              className="download-btn"
              onClick={handleDownload}
              htmlType="button"
            >
              Скачать
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
}
