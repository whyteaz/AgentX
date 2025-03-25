// supabase.js
const { createClient } = require('@supabase/supabase-js');
const config = require('./config');
const { log } = require('./logger');

// Initialize Supabase client
const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);

// Schema definition:
// schedules table:
// - id (uuid, primary key)
// - type (text): 'troll' or 'bootlick'
// - status (text): 'active', 'completed', 'failed'
// - created_at (timestamp)
// - updated_at (timestamp)
// - user_id (uuid): the user who created the schedule
// - data (jsonb): schedule-specific data
//   - For troll: { tweetLink, replyCount, responses: [...] }
//   - For bootlick: { profileUrls: [...], replyCount, responses: [...] }

// Function to create a new schedule
async function createSchedule(type, userId, data) {
  try {
    const { data: schedule, error } = await supabase
      .from('schedules')
      .insert([{ type, status: 'active', user_id: userId, data }])
      .select();

    if (error) throw error;
    
    log('info', `Created ${type} schedule with ID: ${schedule[0].id}`);
    return schedule[0];
  } catch (error) {
    log('error', `Error creating ${type} schedule:`, error);
    throw error;
  }
}

// Function to update a schedule with new data
async function updateSchedule(id, data, status = null) {
  const updateData = { 
    data,
    updated_at: new Date()
  };
  
  if (status) {
    updateData.status = status;
  }
  
  try {
    const { error } = await supabase
      .from('schedules')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    
    log('info', `Updated schedule with ID: ${id}`);
    return true;
  } catch (error) {
    log('error', `Error updating schedule ${id}:`, error);
    throw error;
  }
}

// Function to get all schedules for a user
async function getUserSchedules(userId) {
  try {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data;
  } catch (error) {
    log('error', 'Error fetching user schedules:', error);
    throw error;
  }
}

// Function to get a specific schedule by ID
async function getScheduleById(id) {
  try {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    
    return data;
  } catch (error) {
    log('error', `Error fetching schedule ${id}:`, error);
    throw error;
  }
}

// Function to get all active schedules
async function getActiveSchedules() {
  try {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data;
  } catch (error) {
    log('error', 'Error fetching active schedules:', error);
    throw error;
  }
}

module.exports = {
  createSchedule,
  updateSchedule,
  getUserSchedules,
  getScheduleById,
  getActiveSchedules
};