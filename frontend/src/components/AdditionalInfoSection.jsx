return (
    <div className="bg-white dark:bg-dark-card shadow rounded-lg p-6 mb-6 border border-gray-200 dark:border-dark-border">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Additional Information</h2>
        {isOwnProfile && !isEditing && (
          <button
            onClick={handleAddNew}
            className="flex items-center text-primary hover:text-primary-dark transition duration-300"
          >
            <Plus size={20} className="mr-1" />
            Add Info
          </button>
        )}
      </div>

      {/* List of Additional Info */}
      {!isEditing && additionalInfo.map((info, index) => (
        <div key={index} className="mb-4 flex justify-between items-start group">
          <div className="flex items-start">
            <Info size={20} className="mr-2 mt-1 text-gray-600 dark:text-gray-400" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{info.title}</h3>
              <p className="text-gray-600 dark:text-gray-400">{info.description}</p>
            </div>
          </div>
          {isOwnProfile && (
            <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleEditInfo(index)}
                className="text-gray-500 hover:text-primary transition-colors"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => handleDeleteInfo(index)}
                className="text-gray-500 hover:text-red-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Edit/Add Form */}
      {isEditing && (
        <div className="mt-4">
          <input
            type="text"
            placeholder="Title"
            value={currentInfo.title}
            onChange={(e) => setCurrentInfo({ ...currentInfo, title: e.target.value })}
            className="w-full p-2 border dark:border-gray-600 rounded mb-2 focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <textarea
            placeholder="Description"
            value={currentInfo.description}
            onChange={(e) => setCurrentInfo({ ...currentInfo, description: e.target.value })}
            className="w-full p-2 border dark:border-gray-600 rounded mb-2 focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            rows="3"
          />
          <div className="flex space-x-3">
            <button
              onClick={handleSaveInfo}
              className="bg-primary text-white py-2 px-4 rounded hover:bg-primary-dark transition duration-300"
            >
              {editingIndex !== null ? 'Update Info' : 'Add Info'}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditingIndex(null);
              }}
              className="border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 py-2 px-4 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!isEditing && additionalInfo.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 text-center py-4">No additional information added yet</p>
      )}
    </div>
  ); 