// src/components/DataImport.jsx
import React, { useState } from "react";
import { importAllData, importChatsToFirebase, importUsersToFirebase, importMessagesToFirebase } from "../utils/importData";

const DataImport = () => {
    const [isImporting, setIsImporting] = useState(false);
    const [importStatus, setImportStatus] = useState("");

    const handleImportAll = async () => {
        setIsImporting(true);
        setImportStatus("Importing all data...");
        
        try {
            await importAllData();
            setImportStatus("✅ All data imported successfully!");
        } catch (error) {
            setImportStatus(`❌ Error: ${error.message}`);
        } finally {
            setIsImporting(false);
        }
    };

    const handleImportUsers = async () => {
        setIsImporting(true);
        setImportStatus("Importing users...");
        
        try {
            const result = await importUsersToFirebase();
            setImportStatus(result.success 
                ? `✅ Imported ${result.count} users successfully!`
                : `❌ Error: ${result.error.message}`
            );
        } catch (error) {
            setImportStatus(`❌ Error: ${error.message}`);
        } finally {
            setIsImporting(false);
        }
    };

    const handleImportChats = async () => {
        setIsImporting(true);
        setImportStatus("Importing chats...");
        
        try {
            const result = await importChatsToFirebase();
            setImportStatus(result.success 
                ? `✅ Imported ${result.count} chats successfully!`
                : `❌ Error: ${result.error.message}`
            );
        } catch (error) {
            setImportStatus(`❌ Error: ${error.message}`);
        } finally {
            setIsImporting(false);
        }
    };

    const handleImportMessages = async () => {
        setIsImporting(true);
        setImportStatus("Importing messages...");
        
        try {
            // Update this chatId to match your data
            const chatId = "6BjHfKIogUdLA1ZEJ5mtdILjZFr2-idezqqMvT2Y0elVU88e5mUXpkCr2";
            const result = await importMessagesToFirebase(chatId);
            setImportStatus(result.success 
                ? `✅ Imported ${result.count} messages successfully!`
                : `❌ Error: ${result.error.message}`
            );
        } catch (error) {
            setImportStatus(`❌ Error: ${error.message}`);
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-xl border-2 border-teal-500 z-50">
            <h3 className="text-lg font-bold text-teal-700 mb-3">Data Import</h3>
            
            <div className="flex flex-col gap-2">
                <button
                    onClick={handleImportAll}
                    disabled={isImporting}
                    className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                    Import All Data
                </button>
                
                <button
                    onClick={handleImportUsers}
                    disabled={isImporting}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                    Import Users Only
                </button>
                
                <button
                    onClick={handleImportChats}
                    disabled={isImporting}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                    Import Chats Only
                </button>
                
                <button
                    onClick={handleImportMessages}
                    disabled={isImporting}
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                    Import Messages Only
                </button>
            </div>
            
            {importStatus && (
                <div className={`mt-3 p-2 rounded text-sm ${
                    importStatus.includes("✅") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}>
                    {importStatus}
                </div>
            )}
            
            {isImporting && (
                <div className="mt-3 text-center">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
                </div>
            )}
        </div>
    );
};

export default DataImport;