import React, { useState } from "react";
import { Card, Input, Button, message, Form, Descriptions, Typography, Table, Tag, Steps, Space } from "antd";
import { useOne } from "@refinedev/core";

interface AlfaAction {
    id: string;
    name: string;
    // Add other fields as needed
}

const { Text } = Typography;

const AlfaApiTest: React.FC = () => {
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('alfaApiKey') || '');
    const [cityId, setCityId] = useState("52");
    const [interval, setInterval] = useState("1000");
    const [isFetching, setIsFetching] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setApiKey(newValue);
        localStorage.setItem('alfaApiKey', newValue);
    };

    const handleStart = () => {
        setIsFetching(true);
        refetch()
            .then((response) => {
                if (response.data?.data) {
                    message.success("Данные успешно получены");
                    setCurrentStep((prev) => prev + 1);
                } else {
                    message.error("Получен некорректный ответ от сервера");
                }
            })
            .catch((error) => {
                message.error(`Ошибка: ${error.message}`);
            })
            .finally(() => {
                setIsFetching(false);
            });
    };

    const { data, refetch } = useOne<{ data: AlfaAction[] }>({
        resource: "actions",
        id: "1",
        meta: {
            api_key: apiKey,
            cid: cityId
        },
        queryOptions: {
            enabled: false,
            retry: false // Disable retries
        }
    });

    return (
        <Card title="Alfa API Test" style={{ maxWidth: 1200, margin: "20px auto" }}>
            <Form layout="vertical" style={{ marginTop: 20 }}>
                <Form.Item
                    label="Ваш API Key"
                    required
                    tooltip="Введите ваш API ключ для доступа к сервису"
                >
                    <Input
                        value={apiKey}
                        onChange={handleApiKeyChange}
                    />
                </Form.Item>
                <Form.Item
                    label="ID города"
                    required
                    tooltip="Введите идентификатор города"
                >
                    <Input
                        value={cityId}
                        onChange={(e) => setCityId(e.target.value)}
                    />
                </Form.Item>
            </Form>

            <Steps
                direction="vertical"
                size="small"
                current={currentStep}
                items={[
                    {
                        title: 'Получить список мероприятий для города',
                        description: <Button 
                            type="primary" 
                            onClick={() => {
                                handleStart();
                            }}
                            loading={isFetching}
                            disabled={currentStep !== 0}
                        >
                            Запустить
                        </Button>,
                    },
                    {
                        title: 'Проверить доступность',
                        description: <Space>
                            <Button 
                                type="primary" 
                                onClick={handleStart}
                                loading={isFetching}
                                disabled={currentStep !== 1}
                            >
                                Запустить
                            </Button>
                            <Form.Item
                                label="Интервал (мс)"
                                required
                                tooltip="Укажите интервал между запросами в миллисекундах"
                                style={{ marginBottom: 0 }}
                            >
                                <Input
                                    type="number"
                                    value={interval}
                                    onChange={(e) => setInterval(e.target.value)}
                                    style={{ width: 100 }}
                                />
                            </Form.Item>
                        </Space>,
                    }
                ]}
            />


            {data?.data && (
                <Card style={{ marginTop: 16 }}>
                    <Descriptions 
                        title="Ответ API" 
                        bordered 
                        column={1}
                        style={{ whiteSpace: 'pre-wrap' }}
                    >
                        {/* <Descriptions.Item 
                            label={<Text strong>Ответ decode</Text>}
                        >
                            <div style={{ 
                                maxHeight: '20vh',
                                overflow: 'auto',
                                border: '1px solid #f0f0f0',
                                padding: '8px',
                                borderRadius: '4px',
                                wordWrap: 'break-word',
                                whiteSpace: 'pre-wrap'
                            }}>
                                {JSON.stringify(data.data.decode, null, 2)}
                            </div>
                        </Descriptions.Item> */}
                        {/* <Descriptions.Item 
                            label={<Text strong>Количество мероприятий</Text>}
                        >
                            <Text copyable>{data.data.decode?.actions?.length || 0}</Text>
                        </Descriptions.Item> */}
                    </Descriptions>

                    <Table 
                        dataSource={data.data.decode?.actions}
                        rowKey="actionId"
                        size="small"
                        scroll={{ x: true }}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showTotal: (total) => `Всего: ${total}`
                        }}
                        columns={[
                            {
                                title: 'ID',
                                dataIndex: 'actionId',
                                key: 'actionId',
                                width: 80,
                                fixed: 'left'
                            },
                            {
                                title: 'Название',
                                dataIndex: 'actionName',
                                key: 'actionName',
                                width: 200,
                                fixed: 'left'
                            },
                            {
                                title: 'Площадка',
                                dataIndex: ['venues'],
                                key: 'venue',
                                width: 200,
                                render: (venues) => Object.values(venues)[0]?.venueName
                            },
                            {
                                title: 'Дата',
                                dataIndex: 'from',
                                key: 'date',
                                width: 100,
                                render: (date) => new Date(date).toLocaleDateString()
                            },
                            {
                                title: 'Время',
                                dataIndex: 'time',
                                key: 'time',
                                width: 80
                            },
                            {
                                title: 'Возраст',
                                dataIndex: 'age',
                                key: 'age',
                                width: 80
                            },
                            {
                                title: 'Жанр',
                                dataIndex: ['genres'],
                                key: 'genre',
                                width: 150,
                                render: (genres) => Object.values(genres)[0]?.genreName
                            },
                            {
                                title: 'Ссылка',
                                key: 'link',
                                width: 100,
                                render: (_, record) => {
                                    const venueId = Object.keys(record.venues)[0];
                                    const url = `https://alfa-test.kassir.ru/city/${record.cityId}/${venueId}_${record.actionId}`;
                                    return <a href={url} target="_blank" rel="noopener noreferrer">Открыть</a>;
                                }
                            },
                            {
                                title: 'Доступность',
                                key: 'availability',
                                width: 120,
                                fixed: 'right',
                                render: () => <Tag color="default">не проверено</Tag>
                            }
                        ]}
                    />


                </Card>
            )}
        </Card>
    );
};

export default AlfaApiTest;
