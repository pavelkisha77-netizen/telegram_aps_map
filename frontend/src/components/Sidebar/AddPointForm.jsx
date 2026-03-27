import { useEffect, useState } from 'react';
import { Form, Input, Upload, Button, Spin, Modal, message } from 'antd';
import {
  UploadOutlined,
  CloseOutlined,
  LeftOutlined,
  RightOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { useMapStore } from '../../store/store';
import { createPoint, uploadMedia } from '../../api/api';
import './AddPointForm.css';

export default function AddPointForm({ onSubmitClose }) {
  const draftPoint = useMapStore((state) => state.draftPoint);
  const clearDraftPoint = useMapStore((state) => state.clearDraftPoint);
  const addPoint = useMapStore((state) => state.addPoint);

  const [form] = Form.useForm();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  useEffect(() => {
    form.resetFields();
    setFiles([]);
    setPreviewIndex(0);
  }, [draftPoint, form]);

  const handleUpload = async () => {
    if (!files.length) return [];
    const formData = new FormData();
    files.forEach((file) => file.originFileObj && formData.append('files', file.originFileObj));
    const res = await uploadMedia(formData);
    return res.files || [];
  };

  const safeCreateObjectURL = (file) => {
    if (!file) return '';
    if (file.url) return file.url;
    if (file.originFileObj instanceof Blob) return URL.createObjectURL(file.originFileObj);
    return '';
  };

  const handlePreview = (index) => {
    if (index < 0 || index >= files.length) return;
    setPreviewIndex(index);
    setPreviewVisible(true);
  };

  const handleFinish = async (values) => {
    if (!values.description || !values.description.trim()) {
      message.error('Описание обязательно');
      return;
    }

    try {
      setLoading(true);
      const uploadedMedia = await handleUpload();
      const newPoint = await createPoint({
        title: values.title || 'Без названия',
        description: values.description,
        location: { lat: draftPoint.lat, lng: draftPoint.lng },
        media: uploadedMedia
      });
      addPoint(newPoint);
      form.resetFields();
      setFiles([]);
      clearDraftPoint();
      onSubmitClose?.();
      message.success('Точка добавлена');
    } catch (err) {
      console.error(err);
      message.error('Ошибка при добавлении точки');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setFiles([]);
    clearDraftPoint();
    onSubmitClose?.();
  };

  const removeFile = (index) => setFiles((prev) => prev.filter((_, i) => i !== index));
  const prevPreview = () => setPreviewIndex((prev) => (prev - 1 + files.length) % files.length);
  const nextPreview = () => setPreviewIndex((prev) => (prev + 1) % files.length);

  const currentFile = files[previewIndex];
  const currentUrl = safeCreateObjectURL(currentFile);

  return (
    <Spin spinning={loading}>
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          label="Описание"
          name="description"
          rules={[{ required: true, message: 'Описание обязательно' }]}
        >
          <Input.TextArea placeholder="Описание точки" rows={3} />
        </Form.Item>

        <Upload
          fileList={files}
          beforeUpload={() => false}
          multiple
          showUploadList={false}
          onChange={({ fileList }) => setFiles(fileList)}
        >
          <Button icon={<UploadOutlined />} className="upload-button">
            Выбрать файлы
          </Button>
        </Upload>

        <div className="preview-thumbs">
          {files.map((file, i) => {
            const isImage = file.type?.startsWith('image/');
            const thumbUrl = safeCreateObjectURL(file);
            if (!thumbUrl) return null;
            return (
              <div key={i} className="thumb-wrapper">
                {isImage ? (
                  <img src={thumbUrl} className="thumb-image" onClick={() => handlePreview(i)} />
                ) : (
                  <video
                    src={thumbUrl}
                    className="thumb-image"
                    controls
                    onClick={() => handlePreview(i)}
                  />
                )}
                <Button
                  type="primary"
                  shape="circle"
                  size="small"
                  icon={<CloseOutlined />}
                  className="thumb-remove-btn"
                  onClick={() => removeFile(i)}
                />
              </div>
            );
          })}
        </div>

        <Form.Item style={{ marginTop: 16 }}>
          <Button type="primary" htmlType="submit" style={{ marginRight: 8 }}>
            Сохранить
          </Button>
          <Button onClick={handleCancel}>Отмена</Button>
        </Form.Item>

        <Modal
          visible={previewVisible}
          footer={null}
          onCancel={() => setPreviewVisible(false)}
          width="80%"
          centered
        >
          {currentFile && currentUrl && (
            <div className="modal-preview-wrapper">
              <Button className="prev-btn" icon={<LeftOutlined />} onClick={prevPreview} />
              {currentFile.type?.startsWith('image/') ? (
                <img src={currentUrl} style={{ maxWidth: '80%', maxHeight: '80vh' }} />
              ) : (
                <video src={currentUrl} controls style={{ maxWidth: '80%', maxHeight: '80vh' }} />
              )}
              <Button className="next-btn" icon={<RightOutlined />} onClick={nextPreview} />
              <a href={currentUrl} download className="download-btn">
                <Button icon={<DownloadOutlined />}>Скачать</Button>
              </a>
            </div>
          )}
        </Modal>
      </Form>
    </Spin>
  );
}
