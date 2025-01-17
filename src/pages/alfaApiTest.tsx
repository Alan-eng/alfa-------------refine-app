import React, { useState, useRef } from "react";
import { Card, Input, Button, message, Form, Descriptions, Typography, Table, Tag, Space, Spin, LoadingOutlined, Progress } from "antd";
import { useList } from "@refinedev/core";
import { alfaDataProvider } from "../providers/alfa";

interface AlfaAction {
    actionId: string;
    actionName: string;
    venues: Record<string, any>;
    cityId: string;
    from: string;
    time: string;
    age: string;
    genres: Record<string, { genreName: string }>;
}

interface CheckResult {
    status: number;
    timestamp: string;
}

const { Text } = Typography;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const AlfaApiTest: React.FC = () => {
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('alfaApiKey') || '');
    const [cityId, setCityId] = useState("52");
    const [interval, setInterval] = useState("1000");
    const [isFetching, setIsFetching] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [currentActionId, setCurrentActionId] = useState<string | null>(null);
    const [checkResults, setCheckResults] = useState<Record<string, CheckResult>>({});
    const [minPriceFilter, setMinPriceFilter] = useState<number | null>(null);
    const [maxPriceFilter, setMaxPriceFilter] = useState<number | null>(null);
    const [pageSize, setPageSize] = useState(50);
    const [activeFilter, setActiveFilter] = useState<number | null>(null);
    const stopCheckingRef = useRef(false);

    const { data, refetch } = useList<{ decode: { actions: AlfaAction[] } }>({
        resource: "actions",
        meta: {
            api_key: apiKey,
            cid: cityId
        },
        queryOptions: {
            enabled: false,
            retry: false
        }
    });

    const filteredActions = data?.data?.decode?.actions?.filter(action => {
        if (activeFilter === null) return true;
        return action.minPrice === activeFilter;
    });

    const handleStopChecking = () => {
        stopCheckingRef.current = true;
        setIsChecking(false);
        setCurrentActionId(null);
        message.info("Проверка остановлена");
    };

    const checkActionAvailability = async (actions: any[]) => {
        if (!actions?.length) {
            message.error("Нет данных о мероприятиях");
            return;
        }

        setIsChecking(true);
        stopCheckingRef.current = false;

        try {
            for (let i = 0; i < actions.length; i++) {
                if (stopCheckingRef.current) {
                    return;
                }

                const action = actions[i];
                const venueId = Object.keys(action.venues)[0];

                setCurrentActionId(action.actionId);
                try {
                    const response = await fetch(`/api/json/get_action_ext`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            aid: action.actionId,
                            api_key: apiKey,
                            cid: cityId,
                            vid: venueId
                        })
                    });

                    if (stopCheckingRef.current) {
                        return;
                    }

                    setCheckResults(prev => ({
                        ...prev,
                        [action.actionId]: {
                            status: response.status,
                            timestamp: new Date().toLocaleTimeString()
                        }
                    }));
                } catch (error) {
                    if (stopCheckingRef.current) {
                        return;
                    }

                    console.error(`Error checking action ${action.actionId}:`, error);
                    setCheckResults(prev => ({
                        ...prev,
                        [action.actionId]: {
                            status: 500,
                            timestamp: new Date().toLocaleTimeString()
                        }
                    }));
                }

                if (stopCheckingRef.current) {
                    return;
                }

                setProgress({ current: i + 1, total: actions.length });

                if (i < actions.length - 1) {
                    await sleep(Number(interval));
                }
            }

            if (!stopCheckingRef.current) {
                message.success("Проверка доступности завершена");
                setCurrentStep(prev => prev + 1);
            }
        } catch (error: any) {
            if (!stopCheckingRef.current) {
                message.error(`Ошибка при проверке доступности: ${error.message}`);
            }
        } finally {
            if (!stopCheckingRef.current) {
                setIsChecking(false);
                setCurrentActionId(null);
            }
            stopCheckingRef.current = false;
        }
    };

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

    const handleSearch = (
        selectedKeys: React.Key[],
        confirm: () => void,
        type: 'min' | 'max'
    ) => {
        if (type === 'min') {
            setMinPriceFilter(selectedKeys[0] as number);
        } else {
            setMaxPriceFilter(selectedKeys[0] as number);
        }
        confirm();
    };

    const handleReset = (clearFilters: () => void, type: 'min' | 'max') => {
        clearFilters();
        if (type === 'min') {
            setMinPriceFilter(null);
        } else {
            setMaxPriceFilter(null);
        }
    };

    const handleFilterClick = (value: number | null) => {
        setActiveFilter(activeFilter === value ? null : value);
    };

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

            <div style={{ 
                display: 'flex', 
                gap: '24px', 
                marginBottom: 24,
                padding: '24px',
                background: '#fafafa',
                borderRadius: 8
            }}>
                <Button
                    type={currentStep >= 0 ? "primary" : "default"}
                    size="large"
                    onClick={handleStart}
                    loading={isFetching}
                    style={{ 
                        flex: 1,
                        height: 'auto',
                        padding: '24px',
                        backgroundColor: data?.data?.decode?.actions?.length ? '#13c2c2' : undefined,
                        borderColor: data?.data?.decode?.actions?.length ? '#13c2c2' : undefined,
                    }}
                >
                    <Space direction="vertical" size="small">
                        <span style={{ fontSize: 18, fontWeight: 'bold' }}>Шаг 1</span>
                        <span>Получить список мероприятий</span>
                    </Space>
                </Button>

                <Button
                    type={currentStep >= 1 ? "primary" : "default"}
                    size="large"
                    onClick={() => checkActionAvailability(data?.data?.decode?.actions)}
                    loading={isChecking}
                    disabled={!data?.data?.decode?.actions?.length}
                    style={{ 
                        flex: 1,
                        height: 'auto',
                        padding: '24px'
                    }}
                >
                    <Space direction="vertical" size="small">
                        <span style={{ fontSize: 18, fontWeight: 'bold' }}>Шаг 2</span>
                        <span>Проверить доступность</span>
                        {isChecking ? (
                            <Button 
                                danger
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleStopChecking();
                                }}
                            >
                                Остановить
                            </Button>
                        ) : null}
                        <Input
                            type="number"
                            value={interval}
                            onChange={(e) => setInterval(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            size="small"
                            style={{ width: 120 }}
                            placeholder="Интервал (мс)"
                        />
                    </Space>
                </Button>
            </div>

            {data?.data && (
                <Card style={{ marginTop: 16 }}>
                    <Space size="large" style={{ marginBottom: 16 }}>
                        <div 
                            style={{ textAlign: 'center', cursor: 'pointer' }}
                            onClick={() => handleFilterClick(null)}
                        >
                            <Progress
                                type="circle"
                                size="small"
                                percent={100}
                                format={() => data.data.decode?.actions?.length || 0}
                                strokeColor={activeFilter === null ? "#1890ff" : "#d9d9d9"}
                            />
                            <div style={{ marginTop: 8, color: activeFilter === null ? "#1890ff" : "inherit" }}>
                                Всего Actions
                            </div>
                        </div>
                        <div 
                            style={{ textAlign: 'center', cursor: 'pointer' }}
                            onClick={() => handleFilterClick(0)}
                        >
                            <Progress
                                type="circle"
                                size="small"
                                percent={100}
                                format={() => data.data.decode?.actions?.filter(action => action.minPrice === 0)?.length || 0}
                                strokeColor={activeFilter === 0 ? "#52c41a" : "#d9d9d9"}
                            />
                            <div style={{ marginTop: 8, color: activeFilter === 0 ? "#52c41a" : "inherit" }}>
                                Actions с minPrice = 0
                            </div>
                        </div>
                        <div 
                            style={{ textAlign: 'center', cursor: 'pointer' }}
                            onClick={() => handleFilterClick(111.11)}
                        >
                            <Progress
                                type="circle"
                                size="small"
                                percent={100}
                                format={() => data.data.decode?.actions?.filter(action => action.minPrice === 111.11)?.length || 0}
                                strokeColor={activeFilter === 111.11 ? "#722ed1" : "#d9d9d9"}
                            />
                            <div style={{ marginTop: 8, color: activeFilter === 111.11 ? "#722ed1" : "inherit" }}>
                                Actions с minPrice = 111.11
                            </div>
                        </div>
                    </Space>

                    <Descriptions 
                        title="Ответ API" 
                        bordered 
                        column={1}
                        style={{ whiteSpace: 'pre-wrap' }}
                    >
                    </Descriptions>

                    <Table 
                        dataSource={filteredActions}
                        rowKey="actionId"
                        size="small"
                        scroll={{ x: true }}
                        pagination={{
                            pageSize: pageSize,
                            showSizeChanger: true,
                            showTotal: (total) => `Всего: ${total}`,
                            onChange: (page, size) => {
                                setPageSize(size);
                            }
                        }}
                        rowClassName={(record) => record.actionId === currentActionId ? 'highlight-row' : ''}
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
                                title: 'Мин. цена',
                                dataIndex: 'minPrice',
                                key: 'minPrice',
                                width: 100,
                                filtered: !!minPriceFilter,
                                filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
                                    <div style={{ padding: 8 }}>
                                        <Input
                                            placeholder="Минимальная цена"
                                            value={selectedKeys[0]}
                                            onChange={(e) => {
                                                const value = e.target.value ? Number(e.target.value) : undefined;
                                                setSelectedKeys(value !== undefined ? [value] : []);
                                            }}
                                            onPressEnter={() => handleSearch(selectedKeys, confirm, 'min')}
                                            style={{ width: 188, marginBottom: 8, display: 'block' }}
                                        />
                                        <Space>
                                            <Button
                                                type="primary"
                                                onClick={() => handleSearch(selectedKeys, confirm, 'min')}
                                                size="small"
                                                style={{ width: 90 }}
                                            >
                                                Поиск
                                            </Button>
                                            <Button
                                                onClick={() => handleReset(clearFilters!, 'min')}
                                                size="small"
                                                style={{ width: 90 }}
                                            >
                                                Сброс
                                            </Button>
                                        </Space>
                                    </div>
                                ),
                                filterIcon: (filtered: boolean) => (
                                    <svg
                                        viewBox="64 64 896 896"
                                        focusable="false"
                                        data-icon="search"
                                        width="1em"
                                        height="1em"
                                        fill={filtered ? '#1890ff' : undefined}
                                        aria-hidden="true"
                                    >
                                        <path d="M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0011.6 0l43.6-43.5a8.2 8.2 0 000-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z"></path>
                                    </svg>
                                ),
                                onFilter: (value: number, record) => {
                                    return record.minPrice === value;
                                }
                            },
                            {
                                title: 'Макс. цена',
                                dataIndex: 'maxPrice',
                                key: 'maxPrice',
                                width: 100,
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
                                render: (_, record) => {
                                    const result = checkResults[record.actionId];
                                    
                                    if (record.actionId === currentActionId) {
                                        return (
                                            <Tag color="default">
                                                <Space>
                                                    <Spin size="small" />
                                                    <span>проверяется</span>
                                                </Space>
                                            </Tag>
                                        );
                                    }
                                    
                                    if (result) {
                                        return (
                                            <Tag color={result.status === 200 ? 'success' : 'error'}>
                                                {result.status === 200 
                                                    ? `ОК ${result.timestamp}`
                                                    : `${result.status} ${result.timestamp}`
                                                }
                                            </Tag>
                                        );
                                    }
                                    
                                    return (
                                        <Tag color="default">
                                            {isChecking ? `${progress.current}/${progress.total}` : 'не проверено'}
                                        </Tag>
                                    );
                                }
                            }
                        ]}
                    />
                </Card>
            )}
            <style jsx global>{`
                .highlight-row {
                    background-color: #e6f7ff;
                }
            `}</style>
        </Card>
    );
};

export default AlfaApiTest;
