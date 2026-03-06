import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Alert,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import axios from 'axios';

const API_URL = "http://192.168.8.116:5003"; // ✅ use your backend port


export default function DoctorPendingRequests({ route, navigation }) {
    const { doctor } = route.params;
    
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const response = await axios.get(
                `${API_URL}/doctors/${doctor._id}/pending-requests`
            );
            console.log("✅ Pending requests:", response.data);
            setRequests(response.data.requests || []);
            setLoading(false);
            setRefreshing(false);
        } catch (error) {
            console.log("❌ Error fetching requests:", error);
            setLoading(false);
            setRefreshing(false);
            Alert.alert("Error", "Could not load pending requests");
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchRequests();
    };

    const handleAccept = (request) => {
        Alert.alert(
            "Accept Patient",
            `Accept ${request.patient.name} as your patient?\n\nAge: ${request.patient.age}\nCondition: ${request.patient.condition}`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Accept",
                    onPress: () => processRequest(request._id, 'accept')
                }
            ]
        );
    };

    const handleReject = (request) => {
        Alert.alert(
            "Reject Request",
            `Are you sure you want to reject the request for ${request.patient.name}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reject",
                    style: "destructive",
                    onPress: () => processRequest(request._id, 'reject')
                }
            ]
        );
    };

    const processRequest = async (requestId, action) => {
        setProcessingId(requestId);

        try {
            const endpoint = action === 'accept' ? 'accept' : 'reject';
            const response = await axios.post(
                `${API_URL}/doctor-requests/${requestId}/${endpoint}`
            );

            Alert.alert(
                "Success",
                response.data.message,
                [
                    {
                        text: "OK",
                        onPress: () => {
                            setProcessingId(null);
                            fetchRequests(); // Refresh list
                        }
                    }
                ]
            );
        } catch (error) {
            setProcessingId(null);
            const errorMsg = error.response?.data?.message || `Failed to ${action} request`;
            Alert.alert("Error", errorMsg);
        }
    };

    const getInitials = (name) => {
        if (!name) return '??';
        return name.split(' ').map(word => word[0]).join('').toUpperCase().substring(0, 2);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <StatusBar barStyle="light-content" backgroundColor="#0B5394" />
                <ActivityIndicator size="large" color="#0B5394" />
                <Text style={styles.loadingText}>Loading requests...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0B5394" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Pending Requests</Text>
                    <Text style={styles.headerSubtitle}>
                        {requests.length} {requests.length === 1 ? 'request' : 'requests'}
                    </Text>
                </View>
                <TouchableOpacity 
                    style={styles.refreshButton}
                    onPress={handleRefresh}
                >
                    <Text style={styles.refreshIcon}>🔄</Text>
                </TouchableOpacity>
            </View>

            <ScrollView 
                style={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#0B5394']}
                    />
                }
            >
                {requests.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>📭</Text>
                        <Text style={styles.emptyTitle}>No Pending Requests</Text>
                        <Text style={styles.emptyText}>
                            You don't have any pending patient assignment requests at the moment.
                        </Text>
                    </View>
                ) : (
                    requests.map((request) => (
                        <View key={request._id} style={styles.requestCard}>
                            {/* Patient Info */}
                            <View style={styles.patientSection}>
                                <View style={styles.patientHeader}>
                                    <View style={styles.patientAvatar}>
                                        <Text style={styles.patientAvatarText}>
                                            {getInitials(request.patient.name)}
                                        </Text>
                                    </View>
                                    <View style={styles.patientInfo}>
                                        <Text style={styles.patientName}>
                                            {request.patient.name}
                                        </Text>
                                        <Text style={styles.patientDetails}>
                                            {request.patient.age} years • {request.patient.gender}
                                        </Text>
                                        <View style={styles.conditionBadge}>
                                            <Text style={styles.conditionText}>
                                                {request.patient.condition}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.divider} />

                                {/* Additional Details */}
                                <View style={styles.detailsSection}>
                                    {request.patient.email && (
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailIcon}>✉️</Text>
                                            <Text style={styles.detailText}>
                                                {request.patient.email}
                                            </Text>
                                        </View>
                                    )}
                                    {request.patient.phone && (
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailIcon}>📞</Text>
                                            <Text style={styles.detailText}>
                                                {request.patient.phone}
                                            </Text>
                                        </View>
                                    )}
                                    {request.patient.medicalHistory && (
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailIcon}>📋</Text>
                                            <Text style={styles.detailText}>
                                                {request.patient.medicalHistory}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>

                            {/* Request Info */}
                            <View style={styles.requestInfo}>
                                <View style={styles.requestedBy}>
                                    <Text style={styles.requestLabel}>Requested by:</Text>
                                    <Text style={styles.requestValue}>
                                        {request.requestedBy.fullName} (Caregiver)
                                    </Text>
                                </View>
                                <Text style={styles.requestTime}>
                                    {formatDate(request.createdAt)}
                                </Text>
                            </View>

                            {request.message && (
                                <View style={styles.messageBox}>
                                    <Text style={styles.messageLabel}>Message:</Text>
                                    <Text style={styles.messageText}>{request.message}</Text>
                                </View>
                            )}

                            {/* Action Buttons */}
                            <View style={styles.actionButtons}>
                                <TouchableOpacity 
                                    style={[
                                        styles.rejectButton,
                                        processingId === request._id && styles.buttonDisabled
                                    ]}
                                    onPress={() => handleReject(request)}
                                    disabled={processingId === request._id}
                                >
                                    {processingId === request._id ? (
                                        <ActivityIndicator color="#C53030" size="small" />
                                    ) : (
                                        <>
                                            <Text style={styles.rejectIcon}>✕</Text>
                                            <Text style={styles.rejectText}>Reject</Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={[
                                        styles.acceptButton,
                                        processingId === request._id && styles.buttonDisabled
                                    ]}
                                    onPress={() => handleAccept(request)}
                                    disabled={processingId === request._id}
                                >
                                    {processingId === request._id ? (
                                        <ActivityIndicator color="#FFFFFF" size="small" />
                                    ) : (
                                        <>
                                            <Text style={styles.acceptIcon}>✓</Text>
                                            <Text style={styles.acceptText}>Accept</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}

                <View style={{ height: 30 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7FAFC',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F7FAFC',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#718096',
    },
    header: {
        backgroundColor: '#0B5394',
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backIcon: {
        fontSize: 22,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 2,
    },
    refreshButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    refreshIcon: {
        fontSize: 20,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 80,
    },
    emptyIcon: {
        fontSize: 80,
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2D3748',
        marginBottom: 10,
    },
    emptyText: {
        fontSize: 15,
        color: '#718096',
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 40,
    },
    requestCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        borderWidth: 2,
        borderColor: '#E2E8F0',
    },
    patientSection: {
        marginBottom: 16,
    },
    patientHeader: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    patientAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#4299E1',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    patientAvatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    patientInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    patientName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2D3748',
        marginBottom: 4,
    },
    patientDetails: {
        fontSize: 14,
        color: '#718096',
        marginBottom: 6,
    },
    conditionBadge: {
        backgroundColor: '#FED7D7',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    conditionText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#C53030',
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginBottom: 16,
    },
    detailsSection: {
        gap: 10,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    detailIcon: {
        fontSize: 16,
        marginRight: 10,
        width: 24,
    },
    detailText: {
        flex: 1,
        fontSize: 14,
        color: '#4A5568',
        lineHeight: 20,
    },
    requestInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F7FAFC',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    requestedBy: {
        flex: 1,
    },
    requestLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#718096',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    requestValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2D3748',
    },
    requestTime: {
        fontSize: 13,
        color: '#A0AEC0',
    },
    messageBox: {
        backgroundColor: '#EBF8FF',
        borderLeftWidth: 4,
        borderLeftColor: '#4299E1',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    messageLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#2C5282',
        marginBottom: 4,
    },
    messageText: {
        fontSize: 14,
        color: '#2D3748',
        lineHeight: 20,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    rejectButton: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#FED7D7',
        borderRadius: 12,
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FC8181',
    },
    rejectIcon: {
        fontSize: 18,
        color: '#C53030',
        marginRight: 6,
        fontWeight: 'bold',
    },
    rejectText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#C53030',
    },
    acceptButton: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#0B5394',
        borderRadius: 12,
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    acceptIcon: {
        fontSize: 18,
        color: '#FFFFFF',
        marginRight: 6,
        fontWeight: 'bold',
    },
    acceptText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
});