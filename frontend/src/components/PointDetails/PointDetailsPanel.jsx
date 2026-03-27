import { useEffect, useMemo, useState } from 'react';
import { Drawer, Form, Input, Button, Upload, message, Popconfirm, Empty } from 'antd';
import { UploadOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import { useMapStore } from '../../store/store';
import { deletePoint, updatePoint, uploadMedia } from '../../api/api';
import './PointDetailsPanel.css';

export default function PointDetailsPanel() {
  const selectedPoint = useMapStore((state) => state.selectedPoint);
  const clearSelectedPoint = useMapStore((state) => state.clearSelectedPoint);
  const updatePointInStore = useMapStore((state) => state.updatePointInStore);
  const deletePointFromStore = useMapStore((state) => state.deletePointFromStore);

  const [form] = Form.useForm();
  const [newFiles, setNewFiles] = useState([]);
  const [existingMedia, setExistingMedia] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (selectedPoint) {
      form.setFieldsValue({
        title: selectedPoint.title || '',
        description: selectedPoint.description || ''
      });
      setExistingMedia(selectedPoint.media || []);
      setNewFiles([]);
    } else {
      form.resetFields();
      setExistingMedia([]);
      setNewFiles([]);
    }
  }, [selectedPoint, form]);

  const isOpen = !!selectedPoint;

  const mediaCountText = useMemo(() => {
    const oldCount = existingMedia.length;
    const newCount = newFiles.length;
    return `${oldCount} текущих, ${newCount} новых`;
  }, [existingMedia, newFiles]);

  const handleRemoveExistingMedia = (indexToRemove) => {
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

      const updatedPayload = {
        title: values.title,
        description: values.description,
        location: selectedPoint.location,
        media: [...existingMedia, ...uploadedMedia]
      };

      const updatedPoint = await updatePoint(selectedPoint._id, updatedPayload);

      updatePointInStore(updatedPoint);
      setNewFiles([]);
      message.success('Точка обновлена');
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
    <Drawer
      title="Карточка точки"
      placement="left"
      width={360}
      open={isOpen}
      onClose={clearSelectedPoint}
      className="point-details-drawer"
    >
      <div className="point-details">
        <Form form={form} layout="vertical" onFinish={handleSave} className="point-details__form">
          <Form.Item label="Описание" name="description">
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
                      <img src={item.url} alt="media" className="point-details__media-image" />
                    ) : (
                      <video src={item.url} controls className="point-details__media-video" />
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
    </Drawer>
  );
}
