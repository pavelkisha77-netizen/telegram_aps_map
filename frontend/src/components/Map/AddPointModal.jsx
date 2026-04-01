import { useEffect, useMemo, useState } from 'react';
import { AutoComplete, Button, Form, Input, Upload, message, Modal } from 'antd';
import {
  UploadOutlined,
  CloseOutlined,
  LeftOutlined,
  RightOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { searchCities, searchStreets } from '../../api/visicom';
import { uploadMedia } from '../../api/api';
import { useMapStore } from '../../store/store';
import './AddPointModalForm.css';

const { TextArea } = Input;

export default function AddPointModalForm({ onSubmitClose }) {
  const [form] = Form.useForm();

  const addPoint = useMapStore((state) => state.addPoint);

  const [cityOptions, setCityOptions] = useState([]);
  const [streetOptions, setStreetOptions] = useState([]);

  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedStreet, setSelectedStreet] = useState(null);

  const [cityLoading, setCityLoading] = useState(false);
  const [streetLoading, setStreetLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [fileList, setFileList] = useState([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  const streetDisabled = !selectedCity;
  const saveDisabled = !selectedStreet || saving;

  useEffect(() => {
    return () => {
      fileList.forEach((file) => {
        if (file.preview && file.preview.startsWith('blob:')) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [fileList]);

  const cityAutoCompleteOptions = useMemo(() => {
    return cityOptions.map((item) => ({
      value: item.id,
      label: item.label
    }));
  }, [cityOptions]);

  const streetAutoCompleteOptions = useMemo(() => {
    return streetOptions.map((item) => ({
      value: item.id,
      label: `${item.type ? item.type + ' ' : ''}${item.label}${item.settlement ? `, ${item.settlement}` : ''}`
    }));
  }, [streetOptions]);

  const cleanupFiles = (files) => {
    files.forEach((file) => {
      if (file.preview && file.preview.startsWith('blob:')) {
        URL.revokeObjectURL(file.preview);
      }
    });
  };

  const resetForm = () => {
    cleanupFiles(fileList);
    form.resetFields();
    setSelectedCity(null);
    setSelectedStreet(null);
    setCityOptions([]);
    setStreetOptions([]);
    setFileList([]);
    setPreviewVisible(false);
    setPreviewIndex(0);
  };

  const handleSearchCity = async (value) => {
    setSelectedCity(null);
    setSelectedStreet(null);
    form.setFieldValue('street', undefined);
    setStreetOptions([]);

    if (!value || !value.trim()) {
      setCityOptions([]);
      return;
    }

    try {
      setCityLoading(true);
      const result = await searchCities(value);
      setCityOptions(result);
    } catch (error) {
      console.error(error);
      message.error('Не удалось загрузить список городов');
    } finally {
      setCityLoading(false);
    }
  };

  const handleSelectCity = (value) => {
    const city = cityOptions.find((item) => item.id === value) || null;
    setSelectedCity(city);
    setSelectedStreet(null);
    form.setFieldValue('city', city?.label || '');
    form.setFieldValue('street', undefined);
    setStreetOptions([]);
  };

  const handleSearchStreet = async (value) => {
    setSelectedStreet(null);

    if (!selectedCity || !value || !value.trim()) {
      setStreetOptions([]);
      return;
    }

    try {
      setStreetLoading(true);
      const result = await searchStreets(selectedCity.label || selectedCity.name, value);
      setStreetOptions(result);
    } catch (error) {
      console.error(error);
      message.error('Не удалось загрузить список улиц');
    } finally {
      setStreetLoading(false);
    }
  };

  const handleSelectStreet = (value) => {
    const street = streetOptions.find((item) => item.id === value) || null;
    setSelectedStreet(street);
    form.setFieldValue('street', street?.label || '');
  };

  const beforeUpload = (file) => {
    const isAllowed = file.type.startsWith('image/') || file.type.startsWith('video/');

    if (!isAllowed) {
      message.error('Можно загрузить только фото или видео');
      return Upload.LIST_IGNORE;
    }

    const preview = URL.createObjectURL(file);

    setFileList((prev) => {
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

  const safeCreateObjectURL = (file) => {
    if (!file) return '';
    if (file.url) return file.url;
    if (file.preview) return file.preview;
    if (file.originFileObj instanceof Blob) return URL.createObjectURL(file.originFileObj);
    return '';
  };

  const handlePreview = (index) => {
    if (index < 0 || index >= fileList.length) return;
    setPreviewIndex(index);
    setPreviewVisible(true);
  };

  const removeFile = (index) => {
    const fileToRemove = fileList[index];

    if (fileToRemove?.preview && fileToRemove.preview.startsWith('blob:')) {
      URL.revokeObjectURL(fileToRemove.preview);
    }

    const updatedFiles = fileList.filter((_, i) => i !== index);
    setFileList(updatedFiles);

    if (!updatedFiles.length) {
      setPreviewVisible(false);
      setPreviewIndex(0);
    } else if (previewIndex >= updatedFiles.length) {
      setPreviewIndex(updatedFiles.length - 1);
    }
  };

  const prevPreview = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setPreviewIndex((prev) => (prev - 1 + fileList.length) % fileList.length);
  };

  const nextPreview = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setPreviewIndex((prev) => (prev + 1) % fileList.length);
  };

  const handleDownload = (e) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (!currentUrl) return;

    const link = document.createElement('a');
    link.href = currentUrl;
    link.download = currentFile?.name || 'media';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSave = async () => {
    if (!selectedCity || !selectedStreet) return;

    try {
      setSaving(true);

      const values = await form.validateFields();

      const lat = selectedStreet?.lat;
      const lng = selectedStreet?.lng;

      if (lat == null || lng == null) {
        message.error('Не удалось определить координаты выбранной улицы');
        return;
      }

      let uploadedMedia = [];

      if (fileList.length) {
        const formData = new FormData();

        fileList.forEach((file) => {
          if (file.originFileObj) {
            formData.append('files', file.originFileObj);
          }
        });

        const uploadRes = await uploadMedia(formData);
        uploadedMedia = uploadRes?.files || [];
      }

      addPoint({
        _id: Date.now().toString(),
        city: selectedCity.name || selectedCity.label,
        street: selectedStreet.name || selectedStreet.label,
        description: values.description || '',
        location: {
          lat,
          lng
        },
        markerColor: 'red',
        media: uploadedMedia
      });

      message.success('Точка создана');
      resetForm();

      if (onSubmitClose) {
        onSubmitClose();
      }
    } catch (error) {
      console.error(error);
      message.error('Не удалось сохранить точку');
    } finally {
      setSaving(false);
    }
  };

  const currentFile = fileList[previewIndex];
  const currentUrl = safeCreateObjectURL(currentFile);

  return (
    <Form form={form} layout="vertical">
      <Form.Item name="city" label="Город" rules={[{ required: true, message: 'Выберите город' }]}>
        <AutoComplete
          options={cityAutoCompleteOptions}
          onSearch={handleSearchCity}
          onSelect={handleSelectCity}
          placeholder="Начните вводить город"
          notFoundContent={cityLoading ? 'Загрузка...' : 'Ничего не найдено'}
          filterOption={false}
        />
      </Form.Item>

      <Form.Item
        name="street"
        label="Улица"
        rules={[{ required: true, message: 'Выберите улицу' }]}
      >
        <AutoComplete
          disabled={streetDisabled}
          options={streetAutoCompleteOptions}
          onSearch={handleSearchStreet}
          onSelect={handleSelectStreet}
          placeholder={streetDisabled ? 'Сначала выберите город' : 'Начните вводить улицу'}
          notFoundContent={streetLoading ? 'Загрузка...' : 'Ничего не найдено'}
          filterOption={false}
        />
      </Form.Item>

      <Form.Item name="description" label="Описание">
        <TextArea rows={4} placeholder="Введите описание" />
      </Form.Item>

      <Form.Item label="Файл (фото или видео)">
        <Upload
          beforeUpload={beforeUpload}
          fileList={fileList}
          showUploadList={false}
          multiple
          accept="image/*,video/*"
        >
          <Button icon={<UploadOutlined />} htmlType="button">
            Прикрепить фото или видео
          </Button>
        </Upload>

        <div className="preview-thumbs">
          {fileList.map((file, i) => {
            const isImage = file.type?.startsWith('image/');
            const thumbUrl = safeCreateObjectURL(file);

            if (!thumbUrl) return null;

            return (
              <div key={file.uid || i} className="thumb-wrapper">
                {isImage ? (
                  <img
                    src={thumbUrl}
                    alt={file.name || 'preview'}
                    className="thumb-image"
                    onClick={() => handlePreview(i)}
                  />
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
                  htmlType="button"
                />
              </div>
            );
          })}
        </div>
      </Form.Item>

      <Form.Item style={{ marginBottom: 0 }}>
        <Button type="primary" block onClick={handleSave} loading={saving} disabled={saveDisabled}>
          Сохранить
        </Button>
      </Form.Item>

      <Modal
        open={previewVisible}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width="80%"
        centered
      >
        {currentFile && currentUrl && (
          <div className="modal-preview-wrapper">
            {fileList.length > 1 && (
              <Button
                className="prev-btn"
                icon={<LeftOutlined />}
                onClick={prevPreview}
                htmlType="button"
              />
            )}

            {currentFile.type?.startsWith('image/') ? (
              <img src={currentUrl} alt="preview" style={{ maxWidth: '80%', maxHeight: '80vh' }} />
            ) : (
              <video src={currentUrl} controls style={{ maxWidth: '80%', maxHeight: '80vh' }} />
            )}

            {fileList.length > 1 && (
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
    </Form>
  );
}
